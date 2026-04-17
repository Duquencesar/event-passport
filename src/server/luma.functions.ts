/**
 * Integração direta com a API do Luma (lu.ma)
 *
 * Endpoints usados:
 *   GET /public/v1/calendar/get-items   — lista eventos do calendário
 *   GET /public/v1/event/get-guests     — lista participantes de um evento
 *
 * Autenticação: header x-luma-api-key (chave gerada em lu.ma > Settings > API)
 */

import { createServerFn } from "@tanstack/react-start";
import { db as supabaseAdmin } from "./db";

const LUMA_BASE = "https://api.lu.ma/public/v1";

type LumaEventEntry = {
  api_id: string;
  name: string;
  start_at: string;
  end_at: string;
  url: string;
  geo_address_json: { address?: string; city?: string; country?: string } | null;
  hosts: Array<{ name: string; api_id: string }>;
};

type LumaGuest = {
  api_id: string;
  email: string;
  name: string;
  approval_status: "approved" | "pending" | "declined" | string;
  ticket: { name: string; api_id: string } | null;
  registered_at: string;
};

type LumaGuestPage = {
  entries: LumaGuest[];
  has_more: boolean;
  next_cursor: string | null;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

async function lumaFetch<T>(apiKey: string, path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${LUMA_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      "x-luma-api-key": apiKey,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Luma API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

/** Extrai a data no formato YYYY-MM-DD no fuso de São Paulo */
function toDateKey(isoString: string): string {
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

/** Extrai hora HH:MM no fuso de São Paulo */
function toTimeKey(isoString: string): string {
  const d = new Date(isoString);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Mapeia ticket type do Luma para tag interna */
function ticketToTag(ticketName: string): string | null {
  const lower = ticketName.toLowerCase();
  if (lower.includes("architect") || lower.includes("arquiteto")) return "Arquiteto";
  if (lower.includes("explorer")) return "Explorer";
  if (lower.includes("day pass") || lower.includes("day-pass")) return "Day Pass";
  return null;
}

// ─── server functions públicas ────────────────────────────────────────────────

/**
 * Lista os eventos do calendário Luma.
 * calendar_api_id: encontrado na URL do calendário (lu.ma/c/<id>)
 * ou em Settings > Organizer Profile > API ID.
 */
export const lumaListEvents = createServerFn({ method: "POST" })
  .inputValidator((input: { api_key: string; calendar_api_id: string }) => input)
  .handler(async ({ data }) => {
    const result = await lumaFetch<{ entries: Array<{ event: LumaEventEntry }> }>(
      data.api_key,
      "/calendar/get-items",
      { calendar_api_id: data.calendar_api_id },
    );
    return (result.entries || []).map((e) => ({
      api_id: e.event.api_id,
      name: e.event.name,
      date: toDateKey(e.event.start_at),
      time: toTimeKey(e.event.start_at),
      location: e.event.geo_address_json?.city || e.event.geo_address_json?.address || null,
      organizer: e.event.hosts?.[0]?.name || null,
      url: e.event.url || null,
      start_at: e.event.start_at,
    }));
  });

/**
 * Sincroniza participantes de um evento Luma com o banco local.
 * Cria/atualiza pessoas e registrations. Retorna contagens.
 */
export const lumaSyncEvent = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      api_key: string;
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
    // 1. Garantir que o evento existe no banco
    let internalEventId: string | null = null;
    const { data: existingEvent } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("name", data.event_name)
      .eq("date", data.event_date)
      .maybeSingle();

    if (existingEvent) {
      internalEventId = existingEvent.id;
    } else {
      const { data: newEvent } = await supabaseAdmin
        .from("events")
        .insert({
          name: data.event_name,
          date: data.event_date,
          time: data.event_time || null,
          location: data.event_location || null,
          organizer: data.event_organizer || null,
          url: data.event_url || null,
        })
        .select("id")
        .single();
      internalEventId = newEvent?.id || null;
    }

    // 2. Buscar todos os participantes (paginação automática)
    let allGuests: LumaGuest[] = [];
    let cursor: string | undefined = undefined;
    let pageCount = 0;

    while (pageCount < 20) { // safety cap: 20 pages × 100 = 2000 guests
      const params: Record<string, string> = { event_api_id: data.luma_event_id };
      if (cursor) params.pagination_cursor = cursor;

      const page = await lumaFetch<LumaGuestPage>(data.api_key, "/event/get-guests", params);
      allGuests = allGuests.concat(page.entries || []);

      if (!page.has_more || !page.next_cursor) break;
      cursor = page.next_cursor;
      pageCount++;
    }

    // Filtrar somente aprovados
    const approved = allGuests.filter((g) => g.approval_status === "approved");

    // 3. Upsert people + registrations
    let created = 0;
    let updated = 0;
    let registrations = 0;

    for (const guest of approved) {
      if (!guest.email?.trim() || !guest.name?.trim()) continue;

      const email = guest.email.toLowerCase().trim();
      const name = guest.name.trim();
      const ticketName = guest.ticket?.name || "Geral";
      const tag = ticketToTag(ticketName) || data.default_tag || null;

      const { data: existing } = await supabaseAdmin
        .from("people")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      let personId: string;

      if (existing) {
        personId = existing.id;
        await supabaseAdmin
          .from("people")
          .update({ name, ...(tag ? { tag } : {}) })
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

      // Evitar registrations duplicadas para o mesmo evento
      if (!internalEventId) continue;
      const { data: existingReg } = await supabaseAdmin
        .from("registrations")
        .select("id")
        .eq("person_id", personId)
        .eq("event_id", internalEventId)
        .maybeSingle();

      if (!existingReg) {
        await supabaseAdmin.from("registrations").insert({
          person_id: personId,
          event_name: data.event_name,
          ticket_type: ticketName,
          source: "luma_api",
          event_id: internalEventId,
        });
        registrations++;
      }
    }

    return {
      total_guests: approved.length,
      created,
      updated,
      registrations,
      event_id: internalEventId,
    };
  });
