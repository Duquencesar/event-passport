import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const searchPeople = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string }) => input)
  .handler(async ({ data }) => {
    const q = `%${data.query}%`;
    const { data: people, error } = await supabaseAdmin
      .from("people")
      .select("id, name, email, tag")
      .or(`name.ilike.${q},email.ilike.${q}`)
      .limit(10);
    if (error) throw new Error(error.message);
    return people || [];
  });

export const createCheckin = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      person_id: string;
      period: string;
      access_type: string;
      event_name?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { data: checkin, error } = await supabaseAdmin
      .from("checkins")
      .insert({
        person_id: data.person_id,
        period: data.period,
        access_type: data.access_type,
        event_name: data.event_name || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return checkin;
  });

export const getTodayCheckins = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date().toISOString().split("T")[0];
  const { data: checkins, error } = await supabaseAdmin
    .from("checkins")
    .select("id, period, access_type, event_name, checked_in_at, person_id, people(name, tag)")
    .eq("date", today)
    .order("checked_in_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return checkins || [];
});

export const getTodayCount = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date().toISOString().split("T")[0];
  const { count, error } = await supabaseAdmin
    .from("checkins")
    .select("id", { count: "exact", head: true })
    .eq("date", today);
  if (error) throw new Error(error.message);
  return count || 0;
});
