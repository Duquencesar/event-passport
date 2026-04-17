// Re-export do admin client para uso nas server functions.
// SEMPRE usa service role — nunca degrada para a chave anon (que é bloqueada por RLS).
export { supabaseAdmin as db } from "@/integrations/supabase/client.server";
