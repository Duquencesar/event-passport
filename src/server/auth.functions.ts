import { createServerFn } from "@tanstack/react-start";
import { db } from "./db";

export const staffLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => input)
  .handler(async ({ data }) => {
    const { data: authData, error } = await db.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return {
      access_token: authData.session?.access_token,
      user: { id: authData.user?.id, email: authData.user?.email },
    };
  });

export const getPersonRegistrations = createServerFn({ method: "POST" })
  .inputValidator((input: { person_id: string; event_id?: string }) => input)
  .handler(async ({ data }) => {
    const { data: registrations, error } = await db
      .from("registrations")
      .select("id, event_name, ticket_type, day_pass_date, event_id")
      .eq("person_id", data.person_id);
    if (error) throw new Error(error.message);
    return registrations || [];
  });
