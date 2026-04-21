/**
 * Server functions para status da sincronização Luma e trigger manual.
 */

import { createServerFn } from "@tanstack/react-start";
import { db as supabaseAdmin } from "./db";
import { syncEntireCalendar } from "./luma.server";

/** Retorna o timestamp da última sincronização (mais recente imported_at em registrations). */
export const getLastLumaSync = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("registrations")
    .select("imported_at")
    .order("imported_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return { last_sync: data?.[0]?.imported_at || null };
});

/** Dispara sync completo (eventos + inscritos + check-ins). */
export const triggerLumaSync = createServerFn({ method: "POST" }).handler(async () => {
  const apiKey = process.env.LUMA_API_KEY;
  const calendarId = process.env.LUMA_CALENDAR_API_ID;
  if (!apiKey) {
    throw new Error("LUMA_API_KEY não configurada nos secrets.");
  }
  return syncEntireCalendar({ apiKey, calendarApiId: calendarId });
});
