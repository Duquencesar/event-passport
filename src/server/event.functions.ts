import { createServerFn } from "@tanstack/react-start";
import { getBrasiliaTodayKey } from "@/lib/brasilia-time";
import { db as supabaseAdmin } from "./db";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const getTodayEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const today = await getBrasiliaTodayKey();
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("date", today)
      .order("time", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const getTodayEventsWithStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const today = await getBrasiliaTodayKey();
    const { data: events, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("date", today)
      .order("time", { ascending: true });
    if (error) throw new Error(error.message);
    if (!events || events.length === 0) return [];

    const { count: fullAccessCount } = await supabaseAdmin
      .from("people")
      .select("id", { count: "exact", head: true })
      .or("tag.eq.Arquiteto,tag.eq.Explorer");

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

        const eventSpecific = regResult.count || 0;
        return {
          ...event,
          registration_count: eventSpecific + (fullAccessCount || 0),
          checkin_count: checkinResult.count || 0,
        };
      }),
    );

    return results;
  });

export const getUpcomingEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const today = await getBrasiliaTodayKey();
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const getNextUpcomingEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit: number }) => input)
  .handler(async ({ data }) => {
    const today = await getBrasiliaTodayKey();
    const { data: events, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .gt("date", today)
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    if (!events || events.length === 0) return [];

    const { count: fullAccessCount } = await supabaseAdmin
      .from("people")
      .select("id", { count: "exact", head: true })
      .or("tag.eq.Arquiteto,tag.eq.Explorer");

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
        return {
          ...event,
          registration_count: (regResult.count || 0) + (fullAccessCount || 0),
          checkin_count: checkinResult.count || 0,
        };
      }),
    );
    return results;
  });

export const getEventCheckinCount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { event_id: string }) => input)
  .handler(async ({ data }) => {
    const [eventSpecific, fullAccess] = await Promise.all([
      supabaseAdmin
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", data.event_id),
      supabaseAdmin
        .from("people")
        .select("id", { count: "exact", head: true })
        .or("tag.eq.Arquiteto,tag.eq.Explorer"),
    ]);
    return (eventSpecific.count || 0) + (fullAccess.count || 0);
  });

export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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
