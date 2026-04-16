-- ============================================================
-- Segurança: Restringir acesso às tabelas somente a usuários
-- autenticados via Supabase Auth.
--
-- As server functions usam a service role key (bypass RLS).
-- O cliente browser usa a anon/publishable key + sessão JWT,
-- portanto só funciona após login — garantindo que nenhum
-- dado seja exposto anonimamente via API REST.
-- ============================================================

-- Drop políticas permissivas anteriores
DROP POLICY IF EXISTS "Allow all on people"        ON public.people;
DROP POLICY IF EXISTS "Allow all on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow all on checkins"      ON public.checkins;
DROP POLICY IF EXISTS "Allow all on events"        ON public.events;

-- Garantir que RLS está ativo em todas as tabelas de dados
ALTER TABLE public.people        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events        ENABLE ROW LEVEL SECURITY;

-- Políticas: acesso total somente para usuários autenticados
-- (staff com conta Supabase Auth)
CREATE POLICY "Authenticated staff only — people"
  ON public.people FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated staff only — registrations"
  ON public.registrations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated staff only — checkins"
  ON public.checkins FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated staff only — events"
  ON public.events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabelas Telegram: acesso apenas via service role (sem RLS de client)
-- Mantém políticas existentes (acesso interno apenas)
