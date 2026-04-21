import { createServerFn } from "@tanstack/react-start";
import { db } from "./db";
import { fetchAllRows } from "./pagination";

// IMPORTANTE: emails são PII e NUNCA devem ser retornados para o cliente.
// Server functions usam service role internamente para cruzamento (Luma/import),
// mas só expõem name, tag e dados não-sensíveis.

export const listPeople = createServerFn({ method: "GET" })
  .handler(async () => {
    type Row = { id: string; name: string; tag: string | null; created_at: string };
    return fetchAllRows<Row>((from, to) =>
      db
        .from("people")
        .select("id, name, tag, created_at")
        .order("name", { ascending: true })
        .range(from, to) as unknown as PromiseLike<{ data: Row[] | null; error: { message: string } | null }>,
    );
  });

export const getPeopleWithRegistrations = createServerFn({ method: "GET" })
  .handler(async () => {
    type Row = {
      id: string;
      name: string;
      tag: string | null;
      created_at: string;
      registrations: Array<{
        id: string;
        event_name: string;
        ticket_type: string;
        source: string;
        imported_at: string;
        day_pass_date: string | null;
        week_pass_start_date: string | null;
      }>;
    };
    return fetchAllRows<Row>((from, to) =>
      db
        .from("people")
        .select(
          "id, name, tag, created_at, registrations(id, event_name, ticket_type, source, imported_at, day_pass_date, week_pass_start_date)",
        )
        .order("name", { ascending: true })
        .range(from, to) as unknown as PromiseLike<{ data: Row[] | null; error: { message: string } | null }>,
    );
  });

export const setDayPassDate = createServerFn({ method: "POST" })
  .inputValidator((input: { registrationId: string; date: string }) => input)
  .handler(async ({ data }) => {
    const { error } = await db
      .from("registrations")
      .update({ day_pass_date: data.date })
      .eq("id", data.registrationId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const setWeekPassStartDate = createServerFn({ method: "POST" })
  .inputValidator((input: { registrationId: string; date: string }) => input)
  .handler(async ({ data }) => {
    const { error } = await db
      .from("registrations")
      .update({ week_pass_start_date: data.date })
      .eq("id", data.registrationId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getPeopleCount = createServerFn({ method: "GET" })
  .handler(async () => {
    const { count: total, error } = await db
      .from("people")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);

    const { data: checkinPersons } = await db
      .from("checkins")
      .select("person_id")
      .limit(10000);

    const distinctCheckedIn = new Set((checkinPersons || []).map((c) => c.person_id)).size;

    return {
      total: total || 0,
      checkedIn: distinctCheckedIn,
    };
  });

export const getPersonCheckinHistory = createServerFn({ method: "POST" })
  .inputValidator((input: { person_id: string }) => input)
  .handler(async ({ data }) => {
    const { data: checkins, error } = await db
      .from("checkins")
      .select("id, date, period, access_type, event_name, checked_in_at")
      .eq("person_id", data.person_id)
      .order("checked_in_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return checkins || [];
  });

export const updatePersonTag = createServerFn({ method: "POST" })
  .inputValidator((input: { person_id: string; tag: string }) => input)
  .handler(async ({ data }) => {
    const { error } = await db
      .from("people")
      .update({ tag: data.tag || null })
      .eq("id", data.person_id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getTelegramConfig = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await db
      .from("telegram_config" as any)
      .select("app_url, cron_secret, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data || { app_url: "", cron_secret: "", updated_at: null };
  });

export const saveTelegramConfig = createServerFn({ method: "POST" })
  .inputValidator((input: { app_url: string; cron_secret: string }) => input)
  .handler(async ({ data }) => {
    const { error } = await db
      .from("telegram_config" as any)
      .update({ app_url: data.app_url, cron_secret: data.cron_secret, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { success: true };
  });
