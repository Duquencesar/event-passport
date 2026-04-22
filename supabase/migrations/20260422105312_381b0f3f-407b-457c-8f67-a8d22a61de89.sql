-- 1) Atualiza o cron do Luma para usar a URL pública estável (project--{id}.lovable.app)
SELECT cron.unschedule('luma-sync-hourly');

SELECT cron.schedule(
  'luma-sync-hourly',
  '7 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--ebafd381-81cb-4824-8ffa-acfba3788bda.lovable.app/hooks/luma-sync',
    headers := '{"Content-Type": "application/json", "Lovable-Context": "cron", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jb2NxZWdsZmlsYWFtZGZ4YmRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3NzMsImV4cCI6MjA5MTgzMzc3M30.jtS7ueq7lylMly7Oo4e0Sn6Lv7irO6NovxOo7qxcYPE"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 2) Limpa eventos duplicados criados antes do matching por luma_event_id.
-- Estratégia: para cada (data, nome-normalizado), mantém o evento que TEM luma_event_id;
-- se houver vários, mantém o mais antigo. Migra registrations e checkins para o vencedor
-- e deleta os perdedores.

WITH normalized AS (
  SELECT
    id,
    date,
    -- normaliza nome: lowercase, remove sufixos tipo " (Apr 17)" e múltiplos espaços
    lower(regexp_replace(regexp_replace(name, '\s*\([^)]*\)\s*$', ''), '\s+', ' ', 'g')) AS norm_name,
    luma_event_id,
    created_at
  FROM events
),
ranked AS (
  SELECT
    id,
    date,
    norm_name,
    luma_event_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY date, norm_name
      ORDER BY (luma_event_id IS NULL), created_at ASC
    ) AS rn,
    FIRST_VALUE(id) OVER (
      PARTITION BY date, norm_name
      ORDER BY (luma_event_id IS NULL), created_at ASC
    ) AS keeper_id
  FROM normalized
),
losers AS (
  SELECT id AS loser_id, keeper_id FROM ranked WHERE rn > 1
)
-- Migra registrations
UPDATE registrations r
SET event_id = l.keeper_id
FROM losers l
WHERE r.event_id = l.loser_id;

WITH normalized AS (
  SELECT id, date,
    lower(regexp_replace(regexp_replace(name, '\s*\([^)]*\)\s*$', ''), '\s+', ' ', 'g')) AS norm_name,
    luma_event_id, created_at
  FROM events
),
ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY date, norm_name ORDER BY (luma_event_id IS NULL), created_at ASC) AS rn,
    FIRST_VALUE(id) OVER (PARTITION BY date, norm_name ORDER BY (luma_event_id IS NULL), created_at ASC) AS keeper_id
  FROM normalized
),
losers AS (SELECT id AS loser_id, keeper_id FROM ranked WHERE rn > 1)
UPDATE checkins c
SET event_id = l.keeper_id
FROM losers l
WHERE c.event_id = l.loser_id;

-- Deleta eventos perdedores
WITH normalized AS (
  SELECT id, date,
    lower(regexp_replace(regexp_replace(name, '\s*\([^)]*\)\s*$', ''), '\s+', ' ', 'g')) AS norm_name,
    luma_event_id, created_at
  FROM events
),
ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY date, norm_name ORDER BY (luma_event_id IS NULL), created_at ASC) AS rn
  FROM normalized
)
DELETE FROM events
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 3) Deduplica registrations: mesmo (person_id, event_id) - mantém a mais antiga
WITH dups AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY person_id, event_id ORDER BY imported_at ASC) AS rn
  FROM registrations
  WHERE event_id IS NOT NULL
)
DELETE FROM registrations WHERE id IN (SELECT id FROM dups WHERE rn > 1);

-- 4) Deduplica checkins: mesmo (person_id, event_id) - mantém o mais antigo
WITH dups AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY person_id, event_id ORDER BY checked_in_at ASC) AS rn
  FROM checkins
  WHERE event_id IS NOT NULL
)
DELETE FROM checkins WHERE id IN (SELECT id FROM dups WHERE rn > 1);