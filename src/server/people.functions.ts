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
  const { count, error } = await db
    .from("people")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count || 0;
});
