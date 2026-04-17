import { createServerFn } from "@tanstack/react-start";
import { db } from "./db";

const PAGE_SIZE = 1000;

/** Paginador genérico — Supabase/PostgREST limita cada request a 1000 linhas. */
async function fetchAllPaginated<T>(
  buildQuery: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await buildQuery(from, to);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export const listPeople = createServerFn({ method: "GET" })
  .handler(async () => {
    return fetchAllPaginated((from, to) =>
      db
        .from("people")
        .select("id, name, email, tag, created_at")
        .order("name", { ascending: true })
        .range(from, to),
    );
  });

export const getPeopleWithRegistrations = createServerFn({ method: "GET" })
  .handler(async () => {
    return fetchAllPaginated((from, to) =>
      db
        .from("people")
        .select(
          "id, name, email, tag, created_at, registrations(id, event_name, ticket_type, source, imported_at, day_pass_date)",
        )
        .order("name", { ascending: true })
        .range(from, to),
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
