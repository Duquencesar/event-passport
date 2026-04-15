import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listPeople = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("people")
    .select("id, name, email, tag, created_at")
    .order("name", { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  return data || [];
});

export const getPeopleWithRegistrations = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("people")
      .select("id, name, email, tag, created_at, registrations(id, event_name, ticket_type, source, imported_at)")
      .order("name", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    return data || [];
  },
);

export const getPeopleCount = createServerFn({ method: "GET" }).handler(async () => {
  const { count, error } = await supabaseAdmin
    .from("people")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count || 0;
});
