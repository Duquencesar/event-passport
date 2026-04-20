import { db as supabaseAdmin } from "./db";
import { fetchAllRows } from "./pagination";
import type { Json, Tables, TablesInsert } from "@/integrations/supabase/types";

const BRASILIA_OFFSET = "-03:00";

type RegistrationGrantRow = {
  id: string;
  event_id: string | null;
  event_name: string;
  ticket_type: string;
  source: string;
  day_pass_date: string | null;
  week_pass_start_date: string | null;
  luma_guest_id: string | null;
  people: { id: string; name: string; tag: string | null } | null;
  events: { id: string; name: string; date: string } | null;
};

type HouseUserMapRow = Tables<"house_user_map">;
type HouseGrantRow = Tables<"house_access_grants">;
type HouseGrantInsert = TablesInsert<"house_access_grants">;

type ProcessHouseAccessEventsResult = {
  received: number;
  inserted: number;
  duplicated: number;
  granted_checkins_created: number;
};

export type HouseGrantSnapshot = {
  grant_id: string;
  person_id: string;
  person_name: string | null;
  house_user_id: string;
  source: string;
  source_ref: string;
  grant_scope: string;
  credential_type: string;
  credential_value: string | null;
  valid_from: string;
  valid_until: string;
  status: string;
  event_id: string | null;
  event_name: string | null;
  updated_at: string;
  payload: Json;
};

export type HouseAccessEventInput = {
  house_event_id: string;
  device_id?: string | null;
  door_id?: string | null;
  house_user_id?: string | null;
  credential_type?: "face" | "qrcode" | "card" | "unknown";
  credential_value?: string | null;
  decision: "granted" | "denied";
  reason?: string | null;
  occurred_at: string;
  event_id?: string | null;
  event_name?: string | null;
  raw_payload?: Json;
};

type ParsedCursor = {
  timestamp: string | null;
};

type DerivedGrant = HouseGrantInsert & {
  source: "luma";
  source_ref: string;
};

type ExistingDerivedGrantRow = Pick<
  HouseGrantRow,
  | "id"
  | "person_id"
  | "house_user_id"
  | "event_id"
  | "source"
  | "source_ref"
  | "grant_scope"
  | "credential_type"
  | "credential_value"
  | "access_start"
  | "access_end"
  | "status"
  | "payload"
>;

function nowIso(): string {
  return new Date().toISOString();
}

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function dayStart(dateKey: string): string {
  return `${dateKey}T00:00:00${BRASILIA_OFFSET}`;
}

function dayEnd(dateKey: string): string {
  return `${dateKey}T23:59:59${BRASILIA_OFFSET}`;
}

function parseCursor(value: string | null): ParsedCursor {
  if (!value) return { timestamp: null };
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) {
    throw new Error("Cursor inválido. Use um timestamp ISO-8601.");
  }
  return { timestamp: dt.toISOString() };
}

function getHouseApiToken(): string {
  const token =
    process.env.HOUSE_API_TOKEN ||
    process.env.FOUNDER_HAUS_API_TOKEN ||
    process.env.CONTROLID_BRIDGE_TOKEN;
  if (!token) {
    throw new Error(
      "HOUSE_API_TOKEN (ou FOUNDER_HAUS_API_TOKEN / CONTROLID_BRIDGE_TOKEN) não configurado.",
    );
  }
  return token;
}

export function assertHouseApiRequest(request: Request): void {
  const expected = getHouseApiToken();
  const auth = request.headers.get("authorization");
  const headerToken = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const fallbackToken = request.headers.get("x-house-token");
  const provided = headerToken || fallbackToken;
  if (!provided || provided !== expected) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function fetchRegistrationGrantRows(): Promise<RegistrationGrantRow[]> {
  return fetchAllRows<RegistrationGrantRow>(
    (from, to) =>
      supabaseAdmin
        .from("registrations")
        .select(
          "id, event_id, event_name, ticket_type, source, day_pass_date, week_pass_start_date, luma_guest_id, people!inner(id, name, tag), events(id, name, date)",
        )
        .eq("source", "luma")
        .range(from, to) as unknown as PromiseLike<{
        data: RegistrationGrantRow[] | null;
        error: { message: string } | null;
      }>,
  );
}

async function fetchHouseUserMapRows(): Promise<HouseUserMapRow[]> {
  return fetchAllRows<HouseUserMapRow>(
    (from, to) =>
      supabaseAdmin.from("house_user_map").select("*").range(from, to) as unknown as PromiseLike<{
        data: HouseUserMapRow[] | null;
        error: { message: string } | null;
      }>,
  );
}

function shouldReplacePersonMapEntry(
  current: HouseUserMapRow | undefined,
  next: HouseUserMapRow,
): boolean {
  if (!current) return true;
  if (current.is_active !== next.is_active) return next.is_active;
  if (current.is_resident !== next.is_resident) return !next.is_resident;
  return next.updated_at > current.updated_at;
}

function buildPersonMap(rows: HouseUserMapRow[]): Map<string, HouseUserMapRow> {
  const map = new Map<string, HouseUserMapRow>();
  for (const row of rows) {
    const current = map.get(row.person_id);
    if (shouldReplacePersonMapEntry(current, row)) {
      map.set(row.person_id, row);
    }
  }
  return map;
}

function buildLumaGrant(
  row: RegistrationGrantRow,
  mapByPerson: Map<string, HouseUserMapRow>,
  generatedAt: string,
): DerivedGrant | null {
  if (!row.people) return null;

  let grantScope: HouseGrantInsert["grant_scope"];
  let accessStart: string;
  let accessEnd: string;

  if (row.day_pass_date) {
    grantScope = "day";
    accessStart = dayStart(row.day_pass_date);
    accessEnd = dayEnd(row.day_pass_date);
  } else if (row.week_pass_start_date) {
    grantScope = "week";
    accessStart = dayStart(row.week_pass_start_date);
    accessEnd = dayEnd(addDays(row.week_pass_start_date, 6));
  } else {
    const eventDate = row.events?.date;
    if (!eventDate) return null;
    grantScope = "event";
    accessStart = dayStart(eventDate);
    accessEnd = dayEnd(eventDate);
  }

  const mapped = mapByPerson.get(row.people.id);
  const payload: Json = {
    event_name: row.event_name,
    ticket_type: row.ticket_type,
    luma_guest_id: row.luma_guest_id,
    original_source: row.source,
  };

  return {
    person_id: row.people.id,
    house_user_id: mapped?.house_user_id ?? row.people.id,
    event_id: row.event_id,
    source: "luma",
    source_ref: row.id,
    grant_scope: grantScope,
    credential_type: "qrcode",
    credential_value: row.luma_guest_id ?? null,
    access_start: accessStart,
    access_end: accessEnd,
    status: new Date(accessEnd).getTime() >= Date.now() ? "active" : "expired",
    payload,
    updated_at: generatedAt,
  };
}

function grantKey(input: { source: string; source_ref: string }): string {
  return `${input.source}:${input.source_ref}`;
}

function stableJson(value: Json | null | undefined): string {
  return JSON.stringify(value ?? null);
}

function grantsAreEquivalent(existing: ExistingDerivedGrantRow, next: DerivedGrant): boolean {
  return (
    existing.person_id === next.person_id &&
    existing.house_user_id === next.house_user_id &&
    existing.event_id === next.event_id &&
    existing.source === next.source &&
    existing.source_ref === next.source_ref &&
    existing.grant_scope === next.grant_scope &&
    existing.credential_type === next.credential_type &&
    existing.credential_value === next.credential_value &&
    existing.access_start === next.access_start &&
    existing.access_end === next.access_end &&
    existing.status === next.status &&
    stableJson(existing.payload) === stableJson(next.payload)
  );
}

async function fetchExistingDerivedGrantRows(): Promise<ExistingDerivedGrantRow[]> {
  return fetchAllRows<ExistingDerivedGrantRow>(
    (from, to) =>
      supabaseAdmin
        .from("house_access_grants")
        .select(
          "id, person_id, house_user_id, event_id, source, source_ref, grant_scope, credential_type, credential_value, access_start, access_end, status, payload",
        )
        .in("source", ["luma", "resident"])
        .range(from, to) as unknown as PromiseLike<{
        data: ExistingDerivedGrantRow[] | null;
        error: { message: string } | null;
      }>,
  );
}

async function markStaleGrants(
  existingRows: ExistingDerivedGrantRow[],
  generated: DerivedGrant[],
  generatedAt: string,
): Promise<number> {
  const keep = new Set(generated.map((grant) => grantKey(grant)));
  const stale = existingRows
    .filter((row) => !keep.has(grantKey(row)) && row.status !== "revoked")
    .map((row) => row.id);

  for (let i = 0; i < stale.length; i += 200) {
    const chunk = stale.slice(i, i + 200);
    const { error } = await supabaseAdmin
      .from("house_access_grants")
      .update({ status: "revoked", updated_at: generatedAt })
      .in("id", chunk);
    if (error) throw new Error(error.message);
  }

  return stale.length;
}

export async function rebuildHouseAccessGrants(): Promise<{
  generated_at: string;
  total_generated: number;
  stale_revoked: number;
}> {
  const generatedAt = nowIso();
  const [registrations, houseUsers, existingRows] = await Promise.all([
    fetchRegistrationGrantRows(),
    fetchHouseUserMapRows(),
    fetchExistingDerivedGrantRows(),
  ]);

  const mapByPerson = buildPersonMap(houseUsers);
  const derived: DerivedGrant[] = [];

  for (const row of registrations) {
    const grant = buildLumaGrant(row, mapByPerson, generatedAt);
    if (grant) derived.push(grant);
  }

  const existingByKey = new Map(existingRows.map((row) => [grantKey(row), row]));
  const upserts = derived.filter((grant) => {
    const existing = existingByKey.get(grantKey(grant));
    return !existing || !grantsAreEquivalent(existing, grant);
  });

  for (let i = 0; i < upserts.length; i += 200) {
    const chunk = upserts.slice(i, i + 200);
    const { error } = await supabaseAdmin
      .from("house_access_grants")
      .upsert(chunk, { onConflict: "source,source_ref" });
    if (error) throw new Error(error.message);
  }

  const staleRevoked = await markStaleGrants(existingRows, derived, generatedAt);

  await supabaseAdmin.from("house_sync_state").upsert(
    {
      key: "projection",
      value: {
        generated_at: generatedAt,
        total_generated: derived.length,
        changed_grants: upserts.length,
        stale_revoked: staleRevoked,
      },
      updated_at: generatedAt,
    },
    { onConflict: "key" },
  );

  return {
    generated_at: generatedAt,
    total_generated: derived.length,
    stale_revoked: staleRevoked,
  };
}

async function fetchGrantSnapshots(params?: {
  activeOnly?: boolean;
  updatedSince?: string | null;
  sources?: string[];
}): Promise<HouseGrantSnapshot[]> {
  const rows = await fetchAllRows<
    HouseGrantRow & {
      people: { id: string; name: string } | null;
      events: { id: string; name: string } | null;
    }
  >((from, to) => {
    let query = supabaseAdmin
      .from("house_access_grants")
      .select(
        "id, person_id, house_user_id, source, source_ref, grant_scope, credential_type, credential_value, access_start, access_end, status, event_id, payload, updated_at, created_at, people(id, name), events(id, name)",
      )
      .order("updated_at", { ascending: true })
      .range(from, to);

    if (params?.activeOnly) {
      query = query.eq("status", "active");
    }
    if (params?.updatedSince) {
      query = query.gt("updated_at", params.updatedSince);
    }
    if (params?.sources?.length) {
      query = query.in("source", params.sources);
    }

    return query as unknown as PromiseLike<{
      data: Array<
        HouseGrantRow & {
          people: { id: string; name: string } | null;
          events: { id: string; name: string } | null;
        }
      > | null;
      error: { message: string } | null;
    }>;
  });

  return rows.map((row) => ({
    grant_id: row.id,
    person_id: row.person_id,
    person_name: row.people?.name ?? null,
    house_user_id: row.house_user_id,
    source: row.source,
    source_ref: row.source_ref,
    grant_scope: row.grant_scope,
    credential_type: row.credential_type,
    credential_value: row.credential_value,
    valid_from: row.access_start,
    valid_until: row.access_end,
    status: row.status,
    event_id: row.event_id,
    event_name:
      row.events?.name ??
      (typeof row.payload === "object" && row.payload && "event_name" in row.payload
        ? (row.payload.event_name as string | null)
        : null),
    updated_at: row.updated_at,
    payload: row.payload,
  }));
}

export async function getHouseBootstrap(): Promise<{
  generated_at: string;
  next_cursor: string;
  grants: HouseGrantSnapshot[];
}> {
  const projection = await rebuildHouseAccessGrants();
  const grants = await fetchGrantSnapshots({ activeOnly: true, sources: ["luma"] });
  return {
    generated_at: projection.generated_at,
    next_cursor: grants[grants.length - 1]?.updated_at || projection.generated_at,
    grants,
  };
}

export async function getHouseGrantChanges(cursorValue: string | null): Promise<{
  generated_at: string;
  next_cursor: string;
  grants: HouseGrantSnapshot[];
}> {
  const projection = await rebuildHouseAccessGrants();
  const cursor = parseCursor(cursorValue);
  const grants = await fetchGrantSnapshots({
    updatedSince: cursor.timestamp,
    sources: ["luma"],
  });
  return {
    generated_at: projection.generated_at,
    next_cursor: grants[grants.length - 1]?.updated_at || projection.generated_at,
    grants,
  };
}

function isProcessHouseAccessEventsResult(
  value: Json | null,
): value is ProcessHouseAccessEventsResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return (
    typeof value.received === "number" &&
    typeof value.inserted === "number" &&
    typeof value.duplicated === "number" &&
    typeof value.granted_checkins_created === "number"
  );
}

export async function ingestHouseAccessEvents(input: {
  events: HouseAccessEventInput[];
}): Promise<ProcessHouseAccessEventsResult> {
  const events = input.events || [];
  if (events.length === 0) {
    return { received: 0, inserted: 0, duplicated: 0, granted_checkins_created: 0 };
  }

  const { data, error } = await supabaseAdmin.rpc("process_house_access_events", {
    input_events: events,
  });
  if (error) throw new Error(error.message);
  if (!isProcessHouseAccessEventsResult(data)) {
    throw new Error("process_house_access_events retornou um payload inválido.");
  }

  return data;
}

export async function recordHouseHeartbeat(input: {
  device_id: string;
  label?: string | null;
  metadata?: Json;
}): Promise<{ ok: true; seen_at: string }> {
  const seenAt = nowIso();
  const { error } = await supabaseAdmin.from("house_devices").upsert(
    {
      device_id: input.device_id,
      label: input.label ?? null,
      metadata: input.metadata ?? {},
      last_seen_at: seenAt,
      updated_at: seenAt,
    },
    { onConflict: "device_id" },
  );
  if (error) throw new Error(error.message);
  return { ok: true, seen_at: seenAt };
}

export async function getHouseHealth(): Promise<{
  ok: true;
  checked_at: string;
}> {
  return { ok: true, checked_at: nowIso() };
}
