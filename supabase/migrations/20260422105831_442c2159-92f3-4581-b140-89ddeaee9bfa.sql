-- 1) Desvincula registrations e checkins de eventos que serão deletados (não há FK, mas para consistência)
UPDATE registrations
SET event_id = NULL
WHERE event_id IN (
  SELECT id FROM events WHERE EXTRACT(YEAR FROM date) != EXTRACT(YEAR FROM CURRENT_DATE)
);

UPDATE checkins
SET event_id = NULL
WHERE event_id IN (
  SELECT id FROM events WHERE EXTRACT(YEAR FROM date) != EXTRACT(YEAR FROM CURRENT_DATE)
);

-- 2) Apaga registrations e checkins órfãos (que estavam ligados só a eventos de outros anos)
DELETE FROM registrations WHERE event_id IS NULL;
DELETE FROM checkins WHERE event_id IS NULL;

-- 3) Apaga eventos de outros anos
DELETE FROM events WHERE EXTRACT(YEAR FROM date) != EXTRACT(YEAR FROM CURRENT_DATE);