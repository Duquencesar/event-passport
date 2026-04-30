-- Hardening: explicit deny-all RLS policies on house_* and other server-only tables.
-- All access in this app already uses supabaseAdmin (service role), which BYPASSES RLS.
-- These policies make the *intent* explicit and silence security scanners that flag
-- "RLS enabled but no policies = implicit deny but unclear".

-- Enable RLS where needed and add explicit deny-all for anon + authenticated roles.

ALTER TABLE public.house_access_grants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No direct client access on house_access_grants" ON public.house_access_grants;
CREATE POLICY "No direct client access on house_access_grants"
  ON public.house_access_grants FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

ALTER TABLE public.house_access_logs_raw ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No direct client access on house_access_logs_raw" ON public.house_access_logs_raw;
CREATE POLICY "No direct client access on house_access_logs_raw"
  ON public.house_access_logs_raw FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

ALTER TABLE public.house_devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No direct client access on house_devices" ON public.house_devices;
CREATE POLICY "No direct client access on house_devices"
  ON public.house_devices FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

ALTER TABLE public.house_sync_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No direct client access on house_sync_state" ON public.house_sync_state;
CREATE POLICY "No direct client access on house_sync_state"
  ON public.house_sync_state FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

ALTER TABLE public.house_user_map ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No direct client access on house_user_map" ON public.house_user_map;
CREATE POLICY "No direct client access on house_user_map"
  ON public.house_user_map FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);