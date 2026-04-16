import { createServerFn } from "@tanstack/react-start";
import { db } from "./db";

export const listPeople = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await db
    .from("people")
    .select("id, name, email, tag, created_at")
    .order("name", { ascending: true })
      .limit(2000);
  if (error) throw new Error(error.message);
  return data || [];
});

export const getPeopleWithRegistrations = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await db
      .from("people")
      .select("id, name, email, tag, created_at, registrations(id, event_name, ticket_type, source, imported_at, day_pass_date)")
      .order("name", { ascending: true })
      .limit(2000);
    if (error) throw new Error(error.message);
    return data || [];
  },
);

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

export const getPeopleCount = createServerFn({ method: "GET" }).handler(async () => {
  const [totalResult, checkedInResult] = await Promise.all([
    db.from("people").select("id", { count: "exact", head: true }),
    db.from("checkins").select("person_id", { count: "exact", head: true }),
  ]);
  if (totalResult.error) throw new Error(totalResult.error.message);

  // Count distinct people who checked in using a raw approach
  const { data: distinctData } = await db.rpc("get_distinct_checkin_count" as any);

  return {
    total: totalResult.count || 0,
    checkedIn: typeof distinctData === "number" ? distinctData : 0,
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
