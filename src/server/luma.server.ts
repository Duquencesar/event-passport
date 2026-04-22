/**
 * Helpers server-only para integração Luma.
 * Usados tanto por server functions (UI) quanto pela rota /hooks/luma-sync (cron).
 *
 * Endpoints usados:
 *   GET /v1/calendar/list-events  — lista eventos do calendário
 *   GET /v1/event/get-guests      — lista participantes (com checked_in_at)
 *   GET /v1/event/get-guest       — lookup de guest por id/email/guest key/ticket key
 */

import { db as supabaseAdmin } from "./db";
import type { Json } from "@/integrations/supabase/types";

const LUMA_BASE = "https://public-api.luma.com/v1";
const LUMA_SYNC_STATE_KEY = "luma_sync";
const LUMA_REGISTRATION_SOURCES = ["luma", "luma_api"];

export type LumaEventEntry = {
  api_id: string;
  name: string;
  start_at: string;
  end_at: string;
  url: string;
  geo_address_json: { address?: string; city?: string; country?: string } | null;
  hosts: Array<{ name: string; api_id: string }>;
};

// API do Luma usa formatos diferentes em alguns endpoints.
// Aceitamos ambos: user_email/email, user_name/name.
export type LumaGuest = {
  api_id: string;
  user_email?: string;
  email?: string;
  user_name?: string;
  name?: string;
  approval_status: "approved" | "pending" | "declined" | string;
  event_ticket?: { name?: string | null; api_id?: string } | null;
  ticket?: { name?: string | null; api_id?: string } | null;
  checked_in_at: string | null;
  registered_at: string;
};

export function normalizeLumaLookupId(input: string): string {
  const value = input.trim();
  if (!value) return value;

  try {
    const url = new URL(value);
    const pk = url.searchParams.get("pk");
    if (pk) return pk;
  } catch {
    // Not a URL, use the raw identifier.
  }

  return value;
}

type LumaGuestEntry = {
  api_id: string;
  guest?: LumaGuest;
} & Partial<LumaGuest>;

type LumaGuestPage = {
  entries: LumaGuestEntry[];
  has_more: boolean;
  next_cursor: string | null;
};

// ─── HTTP helper ─────────────────────────────────────────────────────────────

export async function lumaFetch<T>(
  apiKey: string,
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${LUMA_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      "x-luma-api-key": apiKey,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Luma API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Date helpers (America/Sao_Paulo) ────────────────────────────────────────

export function toDateKey(isoString: string): string {
  const d = new Date(isoString);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${day}`;
}

export function toTimeKey(isoString: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}

/** Mapeia ticket type do Luma para tag interna */
export function ticketToTag(ticketName: string): string | null {
  const lower = ticketName.toLowerCase();
  if (lower.includes("architect") || lower.includes("arquiteto")) return "Arquiteto";
  if (lower.includes("explorer")) return "Explorer";
  if (lower.includes("week pass") || lower.includes("weekly") || lower.includes("week-pass") || lower.includes("semanal")) return "Weekly";
  if (lower.includes("day pass") || lower.includes("day-pass")) return "Day Pass";
  return null;
}

/** Determina o período (manha/tarde/noite) a partir de um ISO timestamp */
export function isoToPeriod(isoString: string): "manha" | "tarde" | "noite" {
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
  }).format(new Date(isoString));
  const hour = parseInt(hourStr, 10);
  if (hour < 12) return "manha";
  if (hour < 18) return "tarde";
  return "noite";
}

// ─── Listagem ────────────────────────────────────────────────────────────────

export type NormalizedLumaEvent = {
  api_id: string;
  name: string;
  date: string;
  time: string;
  location: string | null;
  organizer: string | null;
  url: string | null;
  start_at: string;
};

export async function listCalendarEvents(
  apiKey: string,
  calendarApiId?: string,
): Promise<NormalizedLumaEvent[]> {
  if (!calendarApiId?.trim()) {
    throw new Error("LUMA_CALENDAR_API_ID é obrigatório para sincronizar eventos do Luma.");
  }

  // A API retorna eventos do mais antigo para o mais recente, paginados.
  // Para garantir que pegamos os futuros, paginamos até o fim (ou cap de segurança).
  const allEntries: Array<{ event: LumaEventEntry }> = [];
  let cursor: string | undefined;
  let pages = 0;
  const MAX_PAGES = 30; // 30 × 50 = 1500 eventos (mais que suficiente)

  while (pages < MAX_PAGES) {
    const params: Record<string, string> = {
      calendar_api_id: calendarApiId,
      pagination_limit: "50",
      status: "approved",
    };
    if (cursor) params.pagination_cursor = cursor;

    const page = await lumaFetch<{
      entries: Array<{ event: LumaEventEntry }>;
      has_more: boolean;
      next_cursor: string | null;
    }>(apiKey, "/calendar/list-events", params);

    allEntries.push(...(page.entries || []));
    if (!page.has_more || !page.next_cursor) break;
    cursor = page.next_cursor;
    pages++;
  }

  return allEntries.map((e) => ({
    api_id: e.event.api_id,
    name: e.event.name,
    date: toDateKey(e.event.start_at),
    time: toTimeKey(e.event.start_at),
    location: e.event.geo_address_json?.city || e.event.geo_address_json?.address || null,
    organizer: e.event.hosts?.[0]?.name || null,
    url: e.event.url || null,
    start_at: e.event.start_at,
  }));
}

export async function lookupLumaGuest(input: {
  apiKey: string;
  id: string;
  eventId?: string;
}): Promise<Record<string, unknown>> {
  const params: Record<string, string> = {
    id: normalizeLumaLookupId(input.id),
  };
  if (input.eventId) params.event_id = input.eventId;

  return lumaFetch<Record<string, unknown>>(input.apiKey, "/event/get-guest", params);
}

// ─── Sync de um evento (inscritos + check-ins) ───────────────────────────────

export type SyncEventInput = {
  apiKey: string;
  lumaEventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string | null;
  eventOrganizer: string | null;
  eventUrl: string | null;
  defaultTag?: string;
};

export type SyncEventByExternalIdInput = {
  apiKey: string;
  calendarApiId: string;
  lumaEventId: string;
  defaultTag?: string;
};

export type LumaWebhookAuditInput = {
  event_type: string | null;
  luma_event_id: string | null;
  delivery_status: "received" | "processed" | "fallback_full_sync" | "failed";
  sync_mode: "unknown" | "event" | "full";
  error_message?: string | null;
  request_headers?: Json;
  payload?: Json;
  result?: Json;
};

export type SyncEventResult = {
  total_guests: number;
  created: number;
  updated: number;
  registrations: number;
  revoked: number;
  checkins: number;
  event_id: string | null;
};

type SyncStateStatus = "idle" | "running" | "success" | "error";

export type LumaSyncState = {
  status: SyncStateStatus;
  started_at: string | null;
  finished_at: string | null;
  last_success_at: string | null;
  last_error_at: string | null;
  error_message: string | null;
  events_processed: number;
  totals: {
    guests: number;
    created: number;
    updated: number;
    registrations: number;
    revoked: number;
    checkins: number;
  };
};

function nowIso(): string {
  return new Date().toISOString();
}

async function writeLumaSyncState(state: LumaSyncState): Promise<void> {
  const { error } = await supabaseAdmin.from("house_sync_state").upsert(
    {
      key: LUMA_SYNC_STATE_KEY,
      updated_at: nowIso(),
      value: state,
    },
    { onConflict: "key" },
  );
  if (error) throw new Error(error.message);
}

export async function readLumaSyncState(): Promise<LumaSyncState | null> {
  const { data, error } = await supabaseAdmin
    .from("house_sync_state")
    .select("value")
    .eq("key", LUMA_SYNC_STATE_KEY)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.value || typeof data.value !== "object" || Array.isArray(data.value)) return null;

  const value = data.value as Record<string, unknown>;
  const totals =
    value.totals && typeof value.totals === "object" && !Array.isArray(value.totals)
      ? (value.totals as Record<string, unknown>)
      : {};

  return {
    status:
      value.status === "running" || value.status === "success" || value.status === "error"
        ? value.status
        : "idle",
    started_at: typeof value.started_at === "string" ? value.started_at : null,
    finished_at: typeof value.finished_at === "string" ? value.finished_at : null,
    last_success_at: typeof value.last_success_at === "string" ? value.last_success_at : null,
    last_error_at: typeof value.last_error_at === "string" ? value.last_error_at : null,
    error_message: typeof value.error_message === "string" ? value.error_message : null,
    events_processed: typeof value.events_processed === "number" ? value.events_processed : 0,
    totals: {
      guests: typeof totals.guests === "number" ? totals.guests : 0,
      created: typeof totals.created === "number" ? totals.created : 0,
      updated: typeof totals.updated === "number" ? totals.updated : 0,
      registrations: typeof totals.registrations === "number" ? totals.registrations : 0,
      revoked: typeof totals.revoked === "number" ? totals.revoked : 0,
      checkins: typeof totals.checkins === "number" ? totals.checkins : 0,
    },
  };
}

async function markLumaSyncRunning(): Promise<void> {
  const previous = await readLumaSyncState();
  await writeLumaSyncState({
    status: "running",
    started_at: nowIso(),
    finished_at: null,
    last_success_at: previous?.last_success_at || null,
    last_error_at: previous?.last_error_at || null,
    error_message: null,
    events_processed: 0,
    totals: {
      guests: 0,
      created: 0,
      updated: 0,
      registrations: 0,
      revoked: 0,
      checkins: 0,
    },
  });
}

async function markLumaSyncFinished(
  status: Exclude<SyncStateStatus, "idle" | "running">,
  payload: Pick<LumaSyncState, "events_processed" | "totals">,
  errorMessage?: string,
): Promise<void> {
  const previous = await readLumaSyncState();
  const finishedAt = nowIso();
  await writeLumaSyncState({
    status,
    started_at: previous?.started_at || null,
    finished_at: finishedAt,
    last_success_at: status === "success" ? finishedAt : previous?.last_success_at || null,
    last_error_at: status === "error" ? finishedAt : previous?.last_error_at || null,
    error_message: status === "error" ? errorMessage || "Unknown sync error" : null,
    events_processed: payload.events_processed,
    totals: payload.totals,
  });
}

async function revokeStaleLumaRegistrations(input: {
  eventId: string;
  approvedGuestIds: Set<string>;
}): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("registrations")
    .select("id, luma_guest_id")
    .eq("event_id", input.eventId)
    .in("source", LUMA_REGISTRATION_SOURCES);
  if (error) throw new Error(error.message);

  const staleIds = (data || [])
    .filter((row) => !row.luma_guest_id || !input.approvedGuestIds.has(row.luma_guest_id))
    .map((row) => row.id);

  if (staleIds.length === 0) return 0;

  const { error: deleteError } = await supabaseAdmin.from("registrations").delete().in("id", staleIds);
  if (deleteError) throw new Error(deleteError.message);
  return staleIds.length;
}

export async function createLumaWebhookAudit(input: LumaWebhookAuditInput): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("luma_webhook_events")
    .insert({
      provider: "luma",
      event_type: input.event_type,
      luma_event_id: input.luma_event_id,
      delivery_status: input.delivery_status,
      sync_mode: input.sync_mode,
      error_message: input.error_message || null,
      request_headers: input.request_headers || {},
      payload: input.payload || {},
      result: input.result || {},
      processed_at: input.delivery_status === "received" ? null : nowIso(),
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message || "Falha ao registrar webhook do Luma.");
  return data.id;
}

export async function updateLumaWebhookAudit(
  id: string,
  input: Pick<LumaWebhookAuditInput, "delivery_status" | "sync_mode" | "error_message" | "result" | "luma_event_id" | "event_type">,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("luma_webhook_events")
    .update({
      delivery_status: input.delivery_status,
      sync_mode: input.sync_mode,
      error_message: input.error_message || null,
      result: input.result || {},
      luma_event_id: input.luma_event_id,
      event_type: input.event_type,
      processed_at: nowIso(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function syncLumaEvent(input: SyncEventInput): Promise<SyncEventResult> {
  // 1. Garantir evento no banco (prioriza match por luma_event_id)
  let internalEventId: string | null = null;
  const { data: byLumaId } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("luma_event_id", input.lumaEventId)
    .maybeSingle();

  const existingEvent =
    byLumaId ||
    (
      await supabaseAdmin
        .from("events")
        .select("id")
        .eq("name", input.eventName)
        .eq("date", input.eventDate)
        .maybeSingle()
    ).data;

  if (existingEvent) {
    internalEventId = existingEvent.id;
    await supabaseAdmin
      .from("events")
      .update({
        time: input.eventTime || null,
        location: input.eventLocation,
        organizer: input.eventOrganizer,
        url: input.eventUrl,
        luma_event_id: input.lumaEventId,
      })
      .eq("id", internalEventId);
  } else {
    const { data: newEvent } = await supabaseAdmin
      .from("events")
      .insert({
        name: input.eventName,
        date: input.eventDate,
        time: input.eventTime || null,
        location: input.eventLocation,
        organizer: input.eventOrganizer,
        url: input.eventUrl,
        luma_event_id: input.lumaEventId,
      })
      .select("id")
      .single();
    internalEventId = newEvent?.id || null;
  }

  // 2. Buscar todos os participantes (paginação)
  let allGuests: LumaGuest[] = [];
  let cursor: string | undefined = undefined;
  let pageCount = 0;

  while (pageCount < 50) {
    const params: Record<string, string> = {
      event_id: input.lumaEventId,
      pagination_limit: "100",
    };
    if (cursor) params.pagination_cursor = cursor;

    const page = await lumaFetch<LumaGuestPage>(input.apiKey, "/event/get-guests", params);
    // Aceita ambos formatos: { entries: [{ guest: {...} }] } ou { entries: [{...}] }
    const guests: LumaGuest[] = (page.entries || []).map(
      (e) => e.guest ?? (e as unknown as LumaGuest),
    );
    allGuests = allGuests.concat(guests);

    if (!page.has_more || !page.next_cursor) break;
    cursor = page.next_cursor;
    pageCount++;
  }

  const approved = allGuests.filter((g) => g.approval_status === "approved");

  // 3. Upsert people, registrations, checkins
  let created = 0;
  let updated = 0;
  let registrations = 0;
  let revoked = 0;
  let checkins = 0;

  for (const guest of approved) {
    const rawEmail = guest.user_email || guest.email || "";
    const rawName = guest.user_name || guest.name || "";
    if (!rawEmail.trim() || !rawName.trim()) continue;

    const email = rawEmail.toLowerCase().trim();
    const name = rawName.trim();
    const ticketName = guest.event_ticket?.name || guest.ticket?.name || "Geral";
    const tag = ticketToTag(ticketName) || input.defaultTag || null;

    // Upsert person
    const { data: existing } = await supabaseAdmin
      .from("people")
      .select("id, tag")
      .eq("email", email)
      .maybeSingle();

    let personId: string;

    if (existing) {
      personId = existing.id;
      await supabaseAdmin
        .from("people")
        .update({ name, ...(tag && !existing.tag ? { tag } : {}) })
        .eq("id", personId);
      updated++;
    } else {
      const { data: newPerson, error } = await supabaseAdmin
        .from("people")
        .insert({ name, email, tag })
        .select("id")
        .single();
      if (error || !newPerson) continue;
      personId = newPerson.id;
      created++;
    }

    if (!internalEventId) continue;

    // Registration (match por luma_guest_id, fallback para person+event)
    const { data: existingByGuest } = await supabaseAdmin
      .from("registrations")
      .select("id")
      .eq("luma_guest_id", guest.api_id)
      .maybeSingle();

    const existingReg =
      existingByGuest ||
      (
        await supabaseAdmin
          .from("registrations")
          .select("id")
          .eq("person_id", personId)
          .eq("event_id", internalEventId)
          .maybeSingle()
      ).data;

    if (!existingReg) {
      await supabaseAdmin.from("registrations").insert({
        person_id: personId,
        event_name: input.eventName,
        ticket_type: ticketName,
        source: "luma",
        event_id: internalEventId,
        luma_guest_id: guest.api_id,
        // Para Passe Semanal, usa a data do evento como início da semana (ajustável depois pelo admin)
        week_pass_start_date: tag === "Weekly" ? input.eventDate : null,
      });
      registrations++;
    } else {
      await supabaseAdmin
        .from("registrations")
        .update({
          person_id: personId,
          event_name: input.eventName,
          ticket_type: ticketName,
          source: "luma",
          event_id: internalEventId,
          luma_guest_id: guest.api_id,
          week_pass_start_date: tag === "Weekly" ? input.eventDate : null,
        })
        .eq("id", existingReg.id);
    }

    // Check-in vindo do Luma (espelha no banco)
    if (guest.checked_in_at) {
      const { data: existingCheckin } = await supabaseAdmin
        .from("checkins")
        .select("id, source")
        .eq("person_id", personId)
        .eq("event_id", internalEventId)
        .maybeSingle();

      if (!existingCheckin) {
        await supabaseAdmin.from("checkins").insert({
          person_id: personId,
          event_id: internalEventId,
          event_name: input.eventName,
          date: input.eventDate,
          period: isoToPeriod(guest.checked_in_at),
          access_type: ticketName,
          source: "luma",
          checked_in_at: guest.checked_in_at,
          luma_guest_id: guest.api_id,
        });
        checkins++;
      } else {
        // Presença da casa é mais confiável no fluxo operacional final.
        // Se já existir check-in de source=house, só enriquecemos com luma_guest_id.
        await supabaseAdmin
          .from("checkins")
          .update(
            existingCheckin.source === "house"
              ? { luma_guest_id: guest.api_id }
              : {
                  event_name: input.eventName,
                  access_type: ticketName,
                  source: "luma",
                  checked_in_at: guest.checked_in_at,
                  luma_guest_id: guest.api_id,
                },
          )
          .eq("id", existingCheckin.id);
      }
    }
  }

  if (internalEventId) {
    revoked = await revokeStaleLumaRegistrations({
      eventId: internalEventId,
      approvedGuestIds: new Set(approved.map((guest) => guest.api_id)),
    });
  }

  return {
    total_guests: approved.length,
    created,
    updated,
    registrations,
    revoked,
    checkins,
    event_id: internalEventId,
  };
}

export async function syncLumaEventByExternalId(
  input: SyncEventByExternalIdInput,
): Promise<SyncEventResult> {
  const events = await listCalendarEvents(input.apiKey, input.calendarApiId);
  const event = events.find((item) => item.api_id === input.lumaEventId);
  if (!event) {
    throw new Error(`Evento Luma ${input.lumaEventId} não encontrado no calendário configurado.`);
  }

  return syncLumaEvent({
    apiKey: input.apiKey,
    lumaEventId: event.api_id,
    eventName: event.name,
    eventDate: event.date,
    eventTime: event.time,
    eventLocation: event.location,
    eventOrganizer: event.organizer,
    eventUrl: event.url,
    defaultTag: input.defaultTag,
  });
}

// ─── Sync completo (todos os eventos do calendário) ──────────────────────────

export type FullSyncResult = {
  ok: true;
  events_processed: number;
  totals: {
    guests: number;
    created: number;
    updated: number;
    registrations: number;
    revoked: number;
    checkins: number;
  };
  per_event: Array<{ name: string; date: string } & SyncEventResult>;
};

export async function syncEntireCalendar(opts: {
  apiKey: string;
  calendarApiId: string;
  defaultTag?: string;
  /** Só sincroniza eventos a partir desta data (YYYY-MM-DD). Default: 7 dias atrás */
  sinceDate?: string;
}): Promise<FullSyncResult> {
  await markLumaSyncRunning();

  try {
    const events = await listCalendarEvents(opts.apiKey, opts.calendarApiId);

    const cutoff =
      opts.sinceDate ||
      (() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return toDateKey(d.toISOString());
      })();

    const upcoming = events.filter((e) => e.date >= cutoff);

    const totals = { guests: 0, created: 0, updated: 0, registrations: 0, revoked: 0, checkins: 0 };
    const per_event: FullSyncResult["per_event"] = [];

    for (const event of upcoming) {
      try {
        const res = await syncLumaEvent({
          apiKey: opts.apiKey,
          lumaEventId: event.api_id,
          eventName: event.name,
          eventDate: event.date,
          eventTime: event.time,
          eventLocation: event.location,
          eventOrganizer: event.organizer,
          eventUrl: event.url,
          defaultTag: opts.defaultTag,
        });
        totals.guests += res.total_guests;
        totals.created += res.created;
        totals.updated += res.updated;
        totals.registrations += res.registrations;
        totals.revoked += res.revoked;
        totals.checkins += res.checkins;
        per_event.push({ name: event.name, date: event.date, ...res });
      } catch (err) {
        console.error(`Failed to sync event ${event.name}:`, err);
        per_event.push({
          name: event.name,
          date: event.date,
          total_guests: -1,
          created: 0,
          updated: 0,
          registrations: 0,
          revoked: 0,
          checkins: 0,
          event_id: null,
        });
      }
    }

    const result = {
      ok: true as const,
      events_processed: upcoming.length,
      totals,
      per_event,
    };

    await markLumaSyncFinished("success", {
      events_processed: result.events_processed,
      totals: result.totals,
    });

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sync error";
    await markLumaSyncFinished(
      "error",
      {
        events_processed: 0,
        totals: { guests: 0, created: 0, updated: 0, registrations: 0, revoked: 0, checkins: 0 },
      },
      message,
    );
    throw err;
  }
}
