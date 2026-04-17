DROP POLICY IF EXISTS "Full access on telegram_bot_state" ON public.telegram_bot_state;
DROP POLICY IF EXISTS "Full access on telegram_messages" ON public.telegram_messages;
-- Sem políticas = bloqueado para anon/authenticated. Service role (server) bypass.