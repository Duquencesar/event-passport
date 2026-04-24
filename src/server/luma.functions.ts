/**
 * Server functions para a UI interagir com a integração Luma.
 * Lógica pesada vive em luma.server.ts (também usada pelo cron).
 */

import { createServerFn } from "@tanstack/react-start";
import {
  listCalendarEvents,
  syncLumaEvent,
  syncEntireCalendar,
} from "./luma.server";

/** Resolve a API key: usa a fornecida ou cai no env (LUMA_API_KEY). */
function resolveApiKey(provided?: string): string {
  const key = provided?.trim() || process.env.LUMA_API_KEY;
  if (!key) {
    throw new Error(
      "Luma API key não configurada. Defina LUMA_API_KEY nos secrets ou informe na UI.",
    );
  }
  return key;
}

function resolveCalendarId(provided?: string): string {
  const id = provided?.trim() || process.env.LUMA_CALENDAR_API_ID;
  if (!id) {
    throw new Error(
      "Luma Calendar API ID não configurado. Defina LUMA_CALENDAR_API_ID nos secrets ou informe na UI.",
    );
  }
  return id;
}

/** Lista os eventos do calendário Luma. */
export const lumaListEvents = createServerFn({ method: "POST" })
  .inputValidator((input: { api_key?: string; calendar_api_id?: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = resolveApiKey(data.api_key);
    const calendarId = resolveCalendarId(data.calendar_api_id);
    return listCalendarEvents(apiKey, calendarId);
  });

/** Sincroniza inscritos + check-ins de UM evento. */
export const lumaSyncEvent = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      api_key?: string;
      luma_event_id: string;
      event_name: string;
      event_date: string;
      event_time: string;
      event_location: string | null;
      event_organizer: string | null;
      event_url: string | null;
      default_tag?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const apiKey = resolveApiKey(data.api_key);
    return syncLumaEvent({
      apiKey,
      lumaEventId: data.luma_event_id,
      eventName: data.event_name,
      eventDate: data.event_date,
      eventTime: data.event_time,
      eventLocation: data.event_location,
      eventOrganizer: data.event_organizer,
      eventUrl: data.event_url,
      defaultTag: data.default_tag,
    });
  });

/** Sincroniza TUDO (eventos do calendário + inscritos + check-ins). Usado pelo botão manual. */
export const lumaSyncAll = createServerFn({ method: "POST" })
  .inputValidator((input: { default_tag?: string; since_date?: string; until_date?: string } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const apiKey = resolveApiKey();
    const calendarId = resolveCalendarId();
    return syncEntireCalendar({
      apiKey,
      calendarApiId: calendarId,
      defaultTag: data.default_tag,
      sinceDate: data.since_date,
      untilDate: data.until_date,
    });
  });
