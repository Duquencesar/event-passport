-- Permitir acesso anon (além de authenticated) nas tabelas internas
-- Esta é uma ferramenta interna sem login; o publishable key é usado server-side.

DROP POLICY IF EXISTS "Authenticated full access on people" ON public.people;
CREATE POLICY "Full access on people"
  ON public.people FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full access on events" ON public.events;
CREATE POLICY "Full access on events"
  ON public.events FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full access on registrations" ON public.registrations;
CREATE POLICY "Full access on registrations"
  ON public.registrations FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full access on checkins" ON public.checkins;
CREATE POLICY "Full access on checkins"
  ON public.checkins FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full access on telegram_bot_state" ON public.telegram_bot_state;
CREATE POLICY "Full access on telegram_bot_state"
  ON public.telegram_bot_state FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full access on telegram_messages" ON public.telegram_messages;
CREATE POLICY "Full access on telegram_messages"
  ON public.telegram_messages FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);