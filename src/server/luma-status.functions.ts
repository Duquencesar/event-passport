/**
 * Server functions para status da sincronização Luma e trigger manual.
 */

import { createServerFn } from "@tanstack/react-start";
import { db as supabaseAdmin } from "./db";
import { readLumaSyncState, syncEntireCalendar } from "./luma.server";

/** Retorna o estado real da última sincronização do Luma. */
export const getLastLumaSync = createServerFn({ method: "GET" }).handler(async () => {
  const state = await readLumaSyncState();
  if (state) {
    return {
      last_sync: state.last_success_at,
      status: state.status,
      started_at: state.started_at,
      finished_at: state.finished_at,
      last_error_at: state.last_error_at,
      error_message: state.error_message,
      events_processed: state.events_processed,
      totals: state.totals,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("registrations")
    .select("imported_at")
    .order("imported_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return {
    last_sync: data?.[0]?.imported_at || null,
    status: "idle" as const,
    started_at: null,
    finished_at: null,
    last_error_at: null,
    error_message: null,
    events_processed: 0,
    totals: { guests: 0, created: 0, updated: 0, registrations: 0, revoked: 0, checkins: 0 },
  };
});

/** Dispara sync completo (eventos + inscritos + check-ins). */
export const triggerLumaSync = createServerFn({ method: "POST" }).handler(async () => {
  const apiKey = process.env.LUMA_API_KEY;
  const calendarId = process.env.LUMA_CALENDAR_API_ID;
  if (!apiKey) {
    throw new Error("LUMA_API_KEY não configurada nos secrets.");
  }
  if (!calendarId) {
    throw new Error("LUMA_CALENDAR_API_ID não configurado nos secrets.");
  }
  return syncEntireCalendar({ apiKey, calendarApiId: calendarId });
});

export const getRecentLumaWebhookEvents = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("luma_webhook_events")
    .select("id, event_type, luma_event_id, delivery_status, sync_mode, error_message, received_at, processed_at")
    .order("received_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return data || [];
});
