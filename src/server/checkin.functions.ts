import { createServerFn } from "@tanstack/react-start";
import { db as supabaseAdmin } from "./db";

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

export const searchPeopleForEvent = createServerFn({ method: "POST" })
  .inputValidator((input: { query: string; event_id: string }) => input)
  .handler(async ({ data }) => {
    const q = `%${data.query}%`;
    
    const { data: registeredPeople } = await supabaseAdmin
      .from("registrations")
      .select("person_id, people!inner(id, name, email, tag)")
      .eq("event_id", data.event_id)
      .or(`name.ilike.${q},email.ilike.${q}`, { referencedTable: "people" })
      .limit(10);

    const registered = (registeredPeople || []).map((r) => ({
      ...(r.people as unknown as { id: string; name: string; email: string; tag: string | null }),
      registered: true,
    }));

    if (registered.length < 10) {
      const registeredIds = registered.map((r) => r.id);
      const { data: others } = await supabaseAdmin
        .from("people")
        .select("id, name, email, tag")
        .or(`name.ilike.${q},email.ilike.${q}`)
        .limit(10 - registered.length);
      
      const additional = (others || [])
        .filter((p) => !registeredIds.includes(p.id))
        .map((p) => ({ ...p, registered: false }));
      
      return [...registered, ...additional];
    }

    return registered;
  });

export const createCheckin = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      person_id: string;
      period: string;
      access_type: string;
      event_name?: string;
      event_id?: string;
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
        event_id: data.event_id || null,
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
    .select("id, period, access_type, event_name, checked_in_at, person_id, event_id, people(name, tag)")
    .eq("date", today)
    .order("checked_in_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return checkins || [];
});

export const getEventCheckins = createServerFn({ method: "POST" })
  .inputValidator((input: { event_id: string }) => input)
  .handler(async ({ data }) => {
    const { data: checkins, error } = await supabaseAdmin
      .from("checkins")
      .select("id, period, access_type, event_name, checked_in_at, person_id, people(name, tag)")
      .eq("event_id", data.event_id)
      .order("checked_in_at", { ascending: false })
      .limit(50);
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

export const deleteCheckin = createServerFn({ method: "POST" })
  .inputValidator((input: { checkin_id: string }) => input)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("checkins")
      .delete()
      .eq("id", data.checkin_id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateCheckin = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      checkin_id: string;
      period?: string;
      access_type?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const updates: Record<string, string> = {};
    if (data.period) updates.period = data.period;
    if (data.access_type) updates.access_type = data.access_type;
    
    const { error } = await supabaseAdmin
      .from("checkins")
      .update(updates)
      .eq("id", data.checkin_id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getPersonRegistrations = createServerFn({ method: "POST" })
  .inputValidator((input: { person_id: string }) => input)
  .handler(async ({ data }) => {
    const { data: registrations, error } = await supabaseAdmin
      .from("registrations")
      .select("id, event_name, ticket_type, day_pass_date, event_id")
      .eq("person_id", data.person_id);
    if (error) throw new Error(error.message);
    return registrations || [];
  });
