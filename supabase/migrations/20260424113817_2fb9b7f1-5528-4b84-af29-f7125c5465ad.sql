CREATE POLICY "No direct client access on telegram_bot_state"
ON public.telegram_bot_state
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "No direct client access on telegram_messages"
ON public.telegram_messages
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);