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
  const { count: total, error } = await db
    .from("people")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);

  // Get distinct people who checked in by selecting unique person_ids
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
