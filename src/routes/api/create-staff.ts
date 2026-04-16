import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/create-staff")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
          return Response.json({ error: "Missing env vars" }, { status: 500 });
        }
        const body = await request.json();
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await supabase.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
        });
        if (error) return Response.json({ error: error.message }, { status: 400 });
        return Response.json({ id: data.user?.id, email: data.user?.email });
      },
    },
  },
});
