DROP POLICY IF EXISTS "Authenticated full access on checkins" ON public.checkins;

-- SELECT liberado para autenticados (dashboard, listas)
CREATE POLICY "Authenticated read checkins"
  ON public.checkins FOR SELECT
  TO authenticated
  USING (true);

-- INSERT/UPDATE/DELETE só via service role (server functions). Cliente não escreve direto.
-- Sem política para essas ops = bloqueado para roles authenticated/anon.