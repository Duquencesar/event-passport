REVOKE EXECUTE ON FUNCTION public.process_house_access_events(JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_house_access_events(JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_house_access_events(JSONB) FROM authenticated;