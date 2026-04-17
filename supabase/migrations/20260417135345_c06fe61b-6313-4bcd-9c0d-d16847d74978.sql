-- 1. Apertar RLS: remover acesso anônimo. Apenas autenticados (e service role, que bypass).
DROP POLICY IF EXISTS "Full access on people" ON public.people;
DROP POLICY IF EXISTS "Full access on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Full access on checkins" ON public.checkins;
DROP POLICY IF EXISTS "Full access on events" ON public.events;

-- people: NENHUM acesso direto pelo cliente. Apenas service role (server functions) lê/escreve.
CREATE POLICY "No direct client access on people"
  ON public.people FOR ALL
  TO authenticated, anon
  USING (false) WITH CHECK (false);

-- registrations: idem — só servidor manipula.
CREATE POLICY "No direct client access on registrations"
  ON public.registrations FOR ALL
  TO authenticated, anon
  USING (false) WITH CHECK (false);

-- checkins: autenticados podem ler/escrever (não tem PII além do person_id que aponta indiretamente).
CREATE POLICY "Authenticated full access on checkins"
  ON public.checkins FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- events: leitura pública (nome do evento já é público no Luma); escrita só servidor.
CREATE POLICY "Authenticated read events"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);

-- 2. View segura sem email — para qualquer leitura de "pessoas" feita do cliente.
CREATE OR REPLACE VIEW public.people_safe
WITH (security_invoker = on) AS
SELECT id, name, tag, created_at
FROM public.people;

-- Garantir grants para o role authenticated lerem a view.
GRANT SELECT ON public.people_safe TO authenticated;