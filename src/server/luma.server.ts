/**
 * Helpers server-only para integração Luma.
 * Usados tanto por server functions (UI) quanto pela rota /hooks/luma-sync (cron).
 *
 * Endpoints usados:
 *   GET /public/v1/calendar/list-events  — lista eventos do calendário
 *   GET /public/v1/event/get-guests      — lista participantes (com checked_in_at)
 */

import { classifyLumaTicket, isPrimaryAccessTag } from "@/lib/luma-ticket-classification";
import { db as supabaseAdmin } from "./db";

const LUMA_BASE = "https://api.lu.ma/public/v1";

export type LumaEventEntry = {
  api_id?: string;
  id?: string;
  name: string;
  start_at: string;
  end_at?: string;
  url?: string;
  geo_address_json?: { address?: string; city?: string; country?: string } | null;
  hosts?: Array<{ name: string; api_id?: string }>;
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
  return classifyLumaTicket(ticketName).tag;
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
  calendarApiId: string,
  afterIso?: string,
  beforeIso?: string,
): Promise<NormalizedLumaEvent[]> {
  // A API retorna eventos do mais antigo para o mais recente, paginados.
  // Aceita parâmetro `after` (ISO) para filtrar direto na API e evitar paginar
  // milhares de eventos antigos.
  // A API às vezes retorna entries como objetos diretos com `id`,
  // outras vezes wrapped em { event: { api_id, ... } }. Aceitamos ambos.
  const allEntries: Array<{ event?: LumaEventEntry } & Partial<LumaEventEntry>> = [];
  let cursor: string | undefined;
  let pages = 0;
  const MAX_PAGES = 50;

  while (pages < MAX_PAGES) {
    const params: Record<string, string> = {
      calendar_api_id: calendarApiId,
      pagination_limit: "50",
    };
    if (afterIso) params.after = afterIso;
    if (beforeIso) params.before = beforeIso;
    if (cursor) params.pagination_cursor = cursor;

    const page = await lumaFetch<{
      entries: Array<{ event?: LumaEventEntry } & Partial<LumaEventEntry>>;
      has_more: boolean;
      next_cursor: string | null;
    }>(apiKey, "/calendar/list-events", params);

    allEntries.push(...(page.entries || []));
    if (!page.has_more || !page.next_cursor) break;
    cursor = page.next_cursor;
    pages++;
  }

  return allEntries
    .map((entry): NormalizedLumaEvent | null => {
      const ev: LumaEventEntry = entry.event ?? (entry as LumaEventEntry);
      const apiId = ev.api_id || ev.id;
      if (!apiId || !ev.start_at) return null;
      return {
        api_id: apiId,
        name: ev.name,
        date: toDateKey(ev.start_at),
        time: toTimeKey(ev.start_at),
        location:
          ev.geo_address_json?.city || ev.geo_address_json?.address || null,
        organizer: ev.hosts?.[0]?.name || null,
        url: ev.url || null,
        start_at: ev.start_at,
      };
    })
    .filter((e): e is NormalizedLumaEvent => e !== null);
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

export type SyncEventResult = {
  total_guests: number;
  created: number;
  updated: number;
  registrations: number;
  checkins: number;
  event_id: string | null;
};

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
      event_api_id: input.lumaEventId,
      pagination_limit: "100",
    };
    if (cursor) params.pagination_cursor = cursor;

    const page = await lumaFetch<LumaGuestPage>(
      input.apiKey,
      "/event/get-guests",
      params,
    );
    // Aceita ambos formatos: { entries: [{ guest: {...} }] } ou { entries: [{...}] }
    const guests: LumaGuest[] = (page.entries || []).map((e) => (e.guest ?? (e as unknown as LumaGuest)));
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
  let checkins = 0;

  for (const guest of approved) {
    const rawEmail = guest.user_email || guest.email || "";
    const rawName = guest.user_name || guest.name || "";
    if (!rawEmail.trim() || !rawName.trim()) continue;

    const email = rawEmail.toLowerCase().trim();
    const name = rawName.trim();
    const ticketName = guest.event_ticket?.name || guest.ticket?.name || "Geral";
    const ticketClassification = classifyLumaTicket(ticketName);
    const defaultTag = isPrimaryAccessTag(input.defaultTag) ? input.defaultTag : null;
    const tag = ticketClassification.tag || defaultTag;
    const ticketLower = ticketName.toLowerCase();

    // Upsert person
    const { data: existing } = await supabaseAdmin
      .from("people")
      .select("id, tag")
      .eq("email", email)
      .maybeSingle();

    let personId: string;

    if (existing) {
      personId = existing.id;
      const shouldPreservePrimaryTag = isPrimaryAccessTag(existing.tag) && ticketClassification.accessClass !== "primary";
      const nextTag = shouldPreservePrimaryTag ? existing.tag : tag || existing.tag || null;
      if (shouldPreservePrimaryTag) {
        console.log("Luma import: mantendo tag principal da planilha", {
          person_id: personId,
          existing_tag: existing.tag,
          incoming_ticket: ticketName,
          incoming_ticket_class: ticketClassification.accessClass,
          incoming_tag: tag,
          reason: "Pessoa já possui acesso principal indicado pela planilha; ticket recebido não é de acesso principal.",
        });
      }
      await supabaseAdmin
        .from("people")
        .update({ name, tag: nextTag })
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
        source: "luma_api",
        event_id: internalEventId,
        luma_guest_id: guest.api_id,
        // Para Passe Semanal, usa a data do evento como início da semana (ajustável depois pelo admin)
        week_pass_start_date: ticketLower.includes("week") || ticketLower.includes("semanal") ? input.eventDate : null,
        day_pass_date: ticketLower.includes("day pass") || ticketLower.includes("day-pass") ? input.eventDate : null,
      });
      registrations++;
    } else if (!existingByGuest) {
      // Atualiza registro antigo para incluir o luma_guest_id
      await supabaseAdmin
        .from("registrations")
        .update({ luma_guest_id: guest.api_id })
        .eq("id", existingReg.id);
    }

    // Check-in vindo do Luma (espelha no banco)
    if (guest.checked_in_at) {
      const { data: existingCheckin } = await supabaseAdmin
        .from("checkins")
        .select("id")
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
        await supabaseAdmin
          .from("checkins")
          .update({ luma_guest_id: guest.api_id })
          .eq("id", existingCheckin.id);
      }
    }
  }

  return {
    total_guests: approved.length,
    created,
    updated,
    registrations,
    checkins,
    event_id: internalEventId,
  };
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
  /** Só sincroniza eventos até esta data (YYYY-MM-DD). */
  untilDate?: string;
}): Promise<FullSyncResult> {
  const cutoff =
    opts.sinceDate ||
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return toDateKey(d.toISOString());
    })();

  // Passa filtros direto pra API do Luma (evita paginar milhares de eventos antigos)
  const afterIso = `${cutoff}T00:00:00.000Z`;
  const beforeIso = opts.untilDate ? `${opts.untilDate}T23:59:59.999Z` : undefined;
  const events = await listCalendarEvents(opts.apiKey, opts.calendarApiId, afterIso, beforeIso);

  const upcoming = events.filter((e) => e.date >= cutoff && (!opts.untilDate || e.date <= opts.untilDate));

  const totals = { guests: 0, created: 0, updated: 0, registrations: 0, checkins: 0 };
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
        checkins: 0,
        event_id: null,
      });
    }
  }

  return {
    ok: true,
    events_processed: upcoming.length,
    totals,
    per_event,
  };
}
