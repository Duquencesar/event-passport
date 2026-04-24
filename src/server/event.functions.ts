import { createServerFn } from "@tanstack/react-start";
import { getBrasiliaTodayKey } from "@/lib/brasilia-time";
import { hasFullAccessTag, isDayPassValidToday, isWeeklyPassValidToday } from "@/lib/access-validation";
import { db as supabaseAdmin } from "./db";
import { fetchAllRows } from "./pagination";

function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export const getEvents = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  });

export const getAllEventsWithStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: events, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    if (error) throw new Error(error.message);
    if (!events || events.length === 0) return [];

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
        return {
          ...event,
          registration_count: (regResult.count || 0) + (fullAccessCount || 0),
          checkin_count: checkinResult.count || 0,
        };
      }),
    );
    return results;
  });

export const getTodayEvents = createServerFn({ method: "GET" })
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
  .inputValidator((input: { event_id: string }) => input)
  .handler(async ({ data }) => {
    const { count, error } = await supabaseAdmin
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("event_id", data.event_id);
    if (error) throw new Error(error.message);
    return count || 0;
  });

export const getEventParticipants = createServerFn({ method: "POST" })
  .inputValidator((input: { event_id: string; event_date: string }) => input)
  .handler(async ({ data }) => {
    type Participant = { id: string; name: string; tag: string | null; ticket_type: string; access_type: string };
    type RegisteredRow = { ticket_type: string; people: { id: string; name: string; tag: string | null } | null };
    type AccessPersonRow = { id: string; name: string; tag: string | null };
    type TimedRegistrationRow = RegisteredRow & { day_pass_date: string | null; week_pass_start_date: string | null };
    const participants = new Map<string, Participant>();
    const earliestWeeklyStart = addDaysToDateKey(data.event_date, -6);

    const registered = await fetchAllRows<RegisteredRow>((from, to) =>
      supabaseAdmin
        .from("registrations")
        .select("ticket_type, people!inner(id, name, tag)")
        .eq("event_id", data.event_id)
        .range(from, to),
    );

    for (const row of registered) {
      const person = row.people;
      if (!person) continue;
      participants.set(person.id, {
        id: person.id,
        name: person.name,
        tag: person.tag,
        ticket_type: row.ticket_type,
        access_type: hasFullAccessTag(person.tag) ? (person.tag === "Explorer" ? "Explorers" : "IP Village") : "Workshop/Café",
      });
    }

    const accessPeople = await fetchAllRows<AccessPersonRow>((from, to) =>
      supabaseAdmin
        .from("people")
        .select("id, name, tag")
        .or("tag.eq.Arquiteto,tag.eq.Explorer")
        .range(from, to),
    );

    for (const person of accessPeople) {
      if (participants.has(person.id)) continue;
      participants.set(person.id, {
        id: person.id,
        name: person.name,
        tag: person.tag,
        ticket_type: person.tag || "Acesso válido",
        access_type: person.tag === "Explorer" ? "Explorers" : "IP Village",
      });
    }

    const timedRegistrations = await fetchAllRows<TimedRegistrationRow>((from, to) =>
      supabaseAdmin
        .from("registrations")
        .select("ticket_type, day_pass_date, week_pass_start_date, people!inner(id, name, tag)")
        .or(`day_pass_date.eq.${data.event_date},and(week_pass_start_date.gte.${earliestWeeklyStart},week_pass_start_date.lte.${data.event_date})`)
        .range(from, to),
    );

    for (const row of timedRegistrations) {
      const person = row.people;
      if (!person || participants.has(person.id)) continue;
      const hasValidTimedAccess = isDayPassValidToday(row, data.event_date) || isWeeklyPassValidToday(row, data.event_date);
      if (!hasValidTimedAccess) continue;
      participants.set(person.id, {
        id: person.id,
        name: person.name,
        tag: person.tag,
        ticket_type: row.ticket_type,
        access_type: isDayPassValidToday(row, data.event_date) ? "Day Pass" : "IP Village",
      });
    }

    return Array.from(participants.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  });

export const getEventCheckedInParticipantsForExport = createServerFn({ method: "POST" })
  .inputValidator((input: { event_id: string }) => input)
  .handler(async ({ data }) => {
    type Row = {
      id: string;
      period: string;
      access_type: string;
      checked_in_at: string;
      source: string;
      people: { name: string; tag: string | null } | null;
    };

    const { data: rows, error } = await supabaseAdmin
      .from("checkins")
      .select("id, period, access_type, checked_in_at, source, people(name, tag)")
      .eq("event_id", data.event_id)
      .order("checked_in_at", { ascending: true });
    if (error) throw new Error(error.message);

    return ((rows || []) as Row[]).map((row) => ({
      nome: row.people?.name || "",
      categoria: row.people?.tag || row.access_type,
      acesso: row.access_type,
      periodo: row.period,
      checkin_em: row.checked_in_at,
      origem: row.source,
    }));
  });

export const getEventRegistrationCount = createServerFn({ method: "POST" })
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
