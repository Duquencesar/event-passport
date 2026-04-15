import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function getServerClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let _client: ReturnType<typeof getServerClient> | undefined;

export const db = new Proxy({} as ReturnType<typeof getServerClient>, {
  get(_, prop, receiver) {
    if (!_client) _client = getServerClient();
    return Reflect.get(_client, prop, receiver);
  },
});
