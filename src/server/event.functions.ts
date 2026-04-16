import { createServerFn } from "@tanstack/react-start";
import { db as supabaseAdmin } from "./db";

export const getEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
});

export const getTodayEvents = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("date", today)
    .order("time", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
});

export const getTodayEventsWithStats = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date().toISOString().split("T")[0];
  const { data: events, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("date", today)
    .order("time", { ascending: true });
  if (error) throw new Error(error.message);
  if (!events || events.length === 0) return [];

  // Count architects/explorers once (they have access to all events)
  const { count: fullAccessCount } = await supabaseAdmin
    .from("registrations")
    .select("person_id", { count: "exact", head: true })
    .or("ticket_type.ilike.%architect%,ticket_type.ilike.%explorer%");

  const results = await Promise.all(
    events.map(async (event) => {
      const [regResult, checkinResult] = await Promise.all([
        supabaseAdmin
          .from("registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", event.id),
        supabaseAdmin
          .from("checkins")
          .select("id", { count: "exact", head: true })
          .eq("event_id", event.id),
      ]);
      // Event-specific registrations + full access holders (deduplicated count would be ideal but approximation is fine)
      const eventSpecific = regResult.count || 0;
      return {
        ...event,
        registration_count: eventSpecific + (fullAccessCount || 0),
        checkin_count: checkinResult.count || 0,
      };
    })
  );
  return results;
});

export const getUpcomingEvents = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .gte("date", today)
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
});

export const getEventCheckinCount = createServerFn({ method: "POST" })
  .inputValidator((input: { event_id: string }) => input)
  .handler(async ({ data }) => {
    const { count, error } = await supabaseAdmin
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("event_id", data.event_id);
    if (error) throw new Error(error.message);
    return count || 0;
  });

export const getEventRegistrationCount = createServerFn({ method: "POST" })
  .inputValidator((input: { event_id: string }) => input)
  .handler(async ({ data }) => {
    const { count, error } = await supabaseAdmin
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", data.event_id);
    if (error) throw new Error(error.message);
    return count || 0;
  });

export const createEvent = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { name: string; date: string; time?: string; organizer?: string; location?: string; url?: string }) => input,
  )
  .handler(async ({ data }) => {
    const { data: event, error } = await supabaseAdmin
      .from("events")
      .insert({
        name: data.name,
        date: data.date,
        time: data.time || null,
        organizer: data.organizer || null,
        location: data.location || null,
        url: data.url || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return event;
  });
