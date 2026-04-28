import { db as supabaseAdmin } from "./db";
import { fetchAllRows } from "./pagination";
import type { Json, Tables, TablesInsert } from "@/integrations/supabase/types";
import { getCurrentBrasiliaDateKeySync } from "@/lib/brasilia-time";

const BRASILIA_OFFSET = "-03:00";
export const HOUSE_DEMO_MARKER = "house-door-demo-v1";
export const HOUSE_DEMO_EVENT_ID = "11111111-1111-4111-8111-111111111111";
export const HOUSE_DEMO_EVENT_NAME = "Demo Test";
const HOUSE_DEMO_EVENT_TIME = "19:00";
const HOUSE_DEMO_EVENT_ORGANIZER = "Event Passport Demo";
const HOUSE_DEMO_EVENT_LOCATION = "Founder Haus Demo Floor";
const HOUSE_DEMO_EVENT_URL = "https://demo.event-passport.invalid/demo-test";
const HOUSE_DEMO_LUMA_EVENT_ID = "demo-luma-event";

type DemoSeedPerson = {
  person_id: string;
  registration_id?: string;
  map_id: string;
  house_user_id: string;
  name: string;
  email: string;
  tag: string | null;
  credential_type: "qrcode" | "face";
  is_resident: boolean;
  notes: string;
  ticket_type?: string;
  luma_guest_id?: string;
};

const HOUSE_DEMO_PEOPLE: DemoSeedPerson[] = [
  {
    person_id: "22222222-2222-4222-8222-222222222222",
    registration_id: "33333333-3333-4333-8333-333333333333",
    map_id: "44444444-4444-4444-8444-444444444444",
    house_user_id: "demo-guest-ana",
    name: "[DEMO] Ana Guest",
    email: "demo.ana@event-passport.invalid",
    tag: null,
    credential_type: "qrcode",
    is_resident: false,
    notes: "DEMO_HOUSE guest mapped from fake Luma seed",
    ticket_type: "Demo Guest",
    luma_guest_id: "demo-luma-ana",
  },
  {
    person_id: "55555555-5555-4555-8555-555555555555",
    registration_id: "66666666-6666-4666-8666-666666666666",
    map_id: "77777777-7777-4777-8777-777777777777",
    house_user_id: "demo-guest-bruno",
    name: "[DEMO] Bruno Guest",
    email: "demo.bruno@event-passport.invalid",
    tag: null,
    credential_type: "qrcode",
    is_resident: false,
    notes: "DEMO_HOUSE guest mapped from fake Luma seed",
    ticket_type: "Demo Guest",
    luma_guest_id: "demo-luma-bruno",
  },
  {
    person_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    registration_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    map_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    house_user_id: "demo-guest-carla",
    name: "[DEMO] Carla Guest",
    email: "demo.carla@event-passport.invalid",
    tag: null,
    credential_type: "qrcode",
    is_resident: false,
    notes: "DEMO_HOUSE guest mapped from fake Luma seed",
    ticket_type: "Demo Guest",
    luma_guest_id: "demo-luma-carla",
  },
  {
    person_id: "88888888-8888-4888-8888-888888888888",
    map_id: "99999999-9999-4999-8999-999999999999",
    house_user_id: "demo-resident-arthur",
    name: "[DEMO] Arthur Resident",
    email: "demo.resident.arthur@event-passport.invalid",
    tag: "Resident",
    credential_type: "face",
    is_resident: true,
    notes: "DEMO_HOUSE resident kept only on local house side",
  },
];

type RegistrationGrantRow = {
  id: string;
  event_id: string | null;
  event_name: string;
  ticket_type: string;
  source: string;
  day_pass_date: string | null;
  week_pass_start_date: string | null;
  luma_guest_id: string | null;
  people: { id: string; name: string; email: string; tag: string | null } | null;
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

type PreparedHouseDemoResident = {
  person_id: string;
  person_name: string;
  house_user_id: string;
  credential_type: "face";
  status: "active";
  notes: string;
};

type PreparedHouseDemoGuest = {
  person_id: string;
  person_name: string;
  house_user_id: string;
  luma_guest_id: string;
  ticket_type: string;
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

export type PreparedHouseDemo = {
  marker: string;
  event: {
    id: string;
    name: string;
    date: string;
    time: string;
    occurred_at: string;
  };
  guests: PreparedHouseDemoGuest[];
  residents: PreparedHouseDemoResident[];
  grants_projection: {
    generated_at: string;
    total_generated: number;
    stale_revoked: number;
  };
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

function getHouseDemoOccurredAt(dateKey: string): string {
  return `${dateKey}T19:30:00${BRASILIA_OFFSET}`;
}

function isDemoEmail(email: string | null | undefined): boolean {
  return typeof email === "string" && email.endsWith("@event-passport.invalid");
}

function getHouseDemoGuests(): DemoSeedPerson[] {
  return HOUSE_DEMO_PEOPLE.filter((person) => !person.is_resident);
}

function getHouseDemoResidents(): DemoSeedPerson[] {
  return HOUSE_DEMO_PEOPLE.filter((person) => person.is_resident);
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
          "id, event_id, event_name, ticket_type, source, day_pass_date, week_pass_start_date, luma_guest_id, people!inner(id, name, email, tag), events(id, name, date)",
        )
        .in("source", ["luma", "luma_api"])
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
    ...(isDemoEmail(row.people.email)
      ? {
          demo_marker: HOUSE_DEMO_MARKER,
          demo_house_user_id: mapped?.house_user_id ?? row.people.id,
        }
      : {}),
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

async function deleteByIds(table: string, column: string, values: string[]): Promise<void> {
  if (values.length === 0) return;
  // biome-ignore lint/suspicious/noExplicitAny: dynamic table name
  const { error } = await (supabaseAdmin as any).from(table).delete().in(column, values);
  if (error) throw new Error(error.message);
}

async function deleteByValue(table: string, column: string, value: string): Promise<void> {
  // biome-ignore lint/suspicious/noExplicitAny: dynamic table name
  const { error } = await (supabaseAdmin as any).from(table).delete().eq(column, value);
  if (error) throw new Error(error.message);
}

async function deleteByLike(table: string, column: string, pattern: string): Promise<void> {
  // biome-ignore lint/suspicious/noExplicitAny: dynamic table name
  const { error } = await (supabaseAdmin as any).from(table).delete().like(column, pattern);
  if (error) throw new Error(error.message);
}

export async function prepareHouseDemo(): Promise<PreparedHouseDemo> {
  const demoDate = getCurrentBrasiliaDateKeySync();
  const occurredAt = getHouseDemoOccurredAt(demoDate);
  const demoPeople = HOUSE_DEMO_PEOPLE;
  const demoGuests = getHouseDemoGuests();
  const demoResidents = getHouseDemoResidents();

  await deleteByLike("house_access_logs_raw", "house_event_id", "demo-%");
  await deleteByIds(
    "house_access_logs_raw",
    "house_user_id",
    demoPeople.map((person) => person.house_user_id),
  );
  await deleteByValue("house_access_logs_raw", "provided_event_id", HOUSE_DEMO_EVENT_ID);
  await deleteByIds("house_access_logs_raw", "resolved_event_id", [HOUSE_DEMO_EVENT_ID]);

  await deleteByIds(
    "checkins",
    "person_id",
    demoPeople.map((person) => person.person_id),
  );
  await deleteByIds("checkins", "event_id", [HOUSE_DEMO_EVENT_ID]);
  await deleteByIds(
    "house_access_grants",
    "source_ref",
    demoGuests
      .map((person) => person.registration_id)
      .filter((value): value is string => Boolean(value)),
  );
  await deleteByIds(
    "house_access_grants",
    "person_id",
    demoPeople.map((person) => person.person_id),
  );
  await deleteByIds(
    "registrations",
    "id",
    demoGuests.map((person) => person.registration_id!).filter(Boolean),
  );
  await deleteByIds(
    "registrations",
    "luma_guest_id",
    demoGuests.map((person) => person.luma_guest_id!).filter(Boolean),
  );
  await deleteByIds(
    "house_user_map",
    "house_user_id",
    demoPeople.map((person) => person.house_user_id),
  );
  await deleteByIds(
    "house_user_map",
    "id",
    demoPeople.map((person) => person.map_id),
  );
  await deleteByIds(
    "people",
    "email",
    demoPeople.map((person) => person.email),
  );
  await deleteByIds(
    "people",
    "id",
    demoPeople.map((person) => person.person_id),
  );
  await deleteByIds("events", "id", [HOUSE_DEMO_EVENT_ID]);

  const { error: eventError } = await supabaseAdmin.from("events").insert({
    id: HOUSE_DEMO_EVENT_ID,
    name: HOUSE_DEMO_EVENT_NAME,
    date: demoDate,
    time: HOUSE_DEMO_EVENT_TIME,
    organizer: HOUSE_DEMO_EVENT_ORGANIZER,
    location: HOUSE_DEMO_EVENT_LOCATION,
    url: HOUSE_DEMO_EVENT_URL,
    luma_event_id: HOUSE_DEMO_LUMA_EVENT_ID,
  });
  if (eventError) throw new Error(eventError.message);

  const { error: peopleError } = await supabaseAdmin.from("people").insert(
    demoPeople.map((person) => ({
      id: person.person_id,
      name: person.name,
      email: person.email,
      tag: person.tag,
    })),
  );
  if (peopleError) throw new Error(peopleError.message);

  const { error: registrationError } = await supabaseAdmin.from("registrations").insert(
    demoGuests.map((person) => ({
      id: person.registration_id!,
      person_id: person.person_id,
      event_id: HOUSE_DEMO_EVENT_ID,
      event_name: HOUSE_DEMO_EVENT_NAME,
      ticket_type: person.ticket_type!,
      source: "luma",
      luma_guest_id: person.luma_guest_id!,
    })),
  );
  if (registrationError) throw new Error(registrationError.message);

  const { error: mapError } = await supabaseAdmin.from("house_user_map").insert(
    demoPeople.map((person) => ({
      id: person.map_id,
      person_id: person.person_id,
      house_user_id: person.house_user_id,
      is_resident: person.is_resident,
      is_active: true,
      credential_type: person.credential_type,
      notes: `${person.notes} [${HOUSE_DEMO_MARKER}]`,
    })),
  );
  if (mapError) throw new Error(mapError.message);

  const projection = await rebuildHouseAccessGrants();

  return {
    marker: HOUSE_DEMO_MARKER,
    event: {
      id: HOUSE_DEMO_EVENT_ID,
      name: HOUSE_DEMO_EVENT_NAME,
      date: demoDate,
      time: HOUSE_DEMO_EVENT_TIME,
      occurred_at: occurredAt,
    },
    guests: demoGuests.map((person) => ({
      person_id: person.person_id,
      person_name: person.name,
      house_user_id: person.house_user_id,
      luma_guest_id: person.luma_guest_id!,
      ticket_type: person.ticket_type!,
    })),
    residents: demoResidents.map((person) => ({
      person_id: person.person_id,
      person_name: person.name,
      house_user_id: person.house_user_id,
      credential_type: "face",
      status: "active",
      notes: `${person.notes} [${HOUSE_DEMO_MARKER}]`,
    })),
    grants_projection: projection,
  };
}