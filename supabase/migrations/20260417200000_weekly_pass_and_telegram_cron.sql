-- ─── Telegram cron config ─────────────────────────────────────────────────────
-- A coluna week_pass_start_date já foi adicionada pela migration 20260417134433.
-- Esta migration adiciona: telegram_config + pg_cron jobs.

CREATE TABLE IF NOT EXISTS public.telegram_config (
  id   int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  app_url     text NOT NULL DEFAULT '',
  cron_secret text NOT NULL DEFAULT '',
  updated_at  timestamptz DEFAULT now()
);

INSERT INTO public.telegram_config (id, app_url, cron_secret)
VALUES (1, '', '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.telegram_config ENABLE ROW LEVEL SECURITY;

-- Service role (server functions) tem acesso total; bloqueado para outros roles.
-- Sem política = bloqueado para anon/authenticated. Service role bypass RLS.

-- ─── Função que dispara relatório via HTTP ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_telegram_cron_report(p_period text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_url    text;
  v_secret text;
BEGIN
  SELECT app_url, cron_secret
    INTO v_url, v_secret
    FROM public.telegram_config
   WHERE id = 1;

  IF v_url IS NULL OR v_url = '' THEN
    RAISE NOTICE 'telegram_config.app_url não configurado — relatório não enviado';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := v_url || '/hooks/telegram-daily-report',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_secret, '')
    ),
    body    := jsonb_build_object('period', p_period)
  );
END;
$$;

-- ─── pg_cron: relatório ao meio-dia (15:00 UTC = 12:00 BRT) ──────────────────
SELECT cron.schedule(
  'ipe-telegram-noon',
  '0 15 * * 1-5',
  $$ SELECT public.send_telegram_cron_report('morning') $$
);

-- ─── pg_cron: relatório às 18h (21:00 UTC = 18:00 BRT) ───────────────────────
SELECT cron.schedule(
  'ipe-telegram-6pm',
  '0 21 * * 1-5',
  $$ SELECT public.send_telegram_cron_report('afternoon') $$
);
