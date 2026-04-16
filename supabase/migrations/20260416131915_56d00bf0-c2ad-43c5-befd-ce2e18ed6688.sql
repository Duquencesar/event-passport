
-- Drop all existing permissive public policies
DROP POLICY IF EXISTS "Allow all on checkins" ON public.checkins;
DROP POLICY IF EXISTS "Allow all on events" ON public.events;
DROP POLICY IF EXISTS "Allow all on people" ON public.people;
DROP POLICY IF EXISTS "Allow all on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow all on telegram_bot_state" ON public.telegram_bot_state;
DROP POLICY IF EXISTS "Allow all on telegram_messages" ON public.telegram_messages;

-- Create authenticated-only policies for each table
CREATE POLICY "Authenticated full access on checkins"
  ON public.checkins FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access on events"
  ON public.events FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access on people"
  ON public.people FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access on registrations"
  ON public.registrations FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access on telegram_bot_state"
  ON public.telegram_bot_state FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access on telegram_messages"
  ON public.telegram_messages FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
