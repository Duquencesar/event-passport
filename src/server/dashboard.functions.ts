import { createServerFn } from "@tanstack/react-start";
import { HOUSE_DEMO_EVENT_NAME, HOUSE_DEMO_MARKER } from "@/server/house.server";
import { db as supabaseAdmin } from "./db";
import { fetchAllRows } from "./pagination";

type DashboardInput = { from: string; to: string; event_id?: string };
type EventOperationsInput = {
  event_id: string;
  attendance_page?: number;
  absences_page?: number;
  denied_page?: number;
  page_size?: number;
};

type EventOperationsPerson = {
  person_id: string;
  name: string;
  tag: string | null;
};

type EventAttendanceRow = EventOperationsPerson & {
  checkin_id: string;
  checked_in_at: string;
  access_type: string;
  source: string;
};

type EventDeniedRow = {
  id: string;
  occurred_at: string;
  door_id: string | null;
  device_id: string | null;
  reason: string | null;
  resolution_status: string;
  house_user_id: string | null;
  credential_type: string;
  person_name: string | null;
  person_tag: string | null;
};

function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 100) : 10;
  const start = (safePage - 1) * safePageSize;
  return {
    page: safePage,
    page_size: safePageSize,
    total: rows.length,
    total_pages: Math.max(1, Math.ceil(rows.length / safePageSize)),
    items: rows.slice(start, start + safePageSize),
  };
}

export const getDashboardStats = createServerFn({ method: "POST" })
  .inputValidator((input: DashboardInput) => input)
  .handler(async ({ data }) => {
    let q1 = supabaseAdmin
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .gte("date", data.from)
      .lte("date", data.to);
    if (data.event_id) q1 = q1.eq("event_id", data.event_id);
    const { count: totalCheckins } = await q1;

    const uniqueData = await fetchAllRows<{ person_id: string }>((from, to) => {
      let q = supabaseAdmin
        .from("checkins")
        .select("person_id")
        .gte("date", data.from)
        .lte("date", data.to)
        .range(from, to);
      if (data.event_id) q = q.eq("event_id", data.event_id);
      return q;
    });
    const uniquePeople = new Set(uniqueData.map((c) => c.person_id)).size;

    const archData = await fetchAllRows<{ person_id: string }>((from, to) => {
      let q = supabaseAdmin
        .from("checkins")
        .select("person_id, people!inner(tag)")
        .gte("date", data.from)
        .lte("date", data.to)
        .eq("people.tag", "Arquiteto")
        .range(from, to);
      if (data.event_id) q = q.eq("event_id", data.event_id);
      return q;
    });
    const architects = new Set(archData.map((c) => c.person_id)).size;

    return { totalCheckins: totalCheckins || 0, uniquePeople, architects };
  });

export const getDailyAttendance = createServerFn({ method: "POST" })
  .inputValidator((input: DashboardInput) => input)
  .handler(async ({ data }) => {
    const checkins = await fetchAllRows<{ date: string; id: string }>((from, to) => {
      let q = supabaseAdmin
        .from("checkins")
        .select("date, id")
        .gte("date", data.from)
        .lte("date", data.to)
        .range(from, to);
      if (data.event_id) q = q.eq("event_id", data.event_id);
      return q;
    });

    const byDate: Record<string, number> = {};
    for (const c of checkins) {
      byDate[c.date] = (byDate[c.date] || 0) + 1;
    }

    return Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  });

export const getAccessTypeBreakdown = createServerFn({ method: "POST" })
  .inputValidator((input: DashboardInput) => input)
  .handler(async ({ data }) => {
    const checkins = await fetchAllRows<{ access_type: string }>((from, to) => {
      let q = supabaseAdmin
        .from("checkins")
        .select("access_type")
        .gte("date", data.from)
        .lte("date", data.to)
        .range(from, to);
      if (data.event_id) q = q.eq("event_id", data.event_id);
      return q;
    });

    const byType: Record<string, number> = {};
    for (const c of checkins) {
      byType[c.access_type] = (byType[c.access_type] || 0) + 1;
    }

    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  });

export const getTopAttendees = createServerFn({ method: "POST" })
  .inputValidator((input: DashboardInput) => input)
  .handler(async ({ data }) => {
    type Row = {
      person_id: string;
      people: { name: string; tag: string | null } | null;
    };
    const checkins = await fetchAllRows<Row>((from, to) => {
      let q = supabaseAdmin
        .from("checkins")
        .select("person_id, people(name, tag)")
        .gte("date", data.from)
        .lte("date", data.to)
        .range(from, to);
      if (data.event_id) q = q.eq("event_id", data.event_id);
      return q as unknown as PromiseLike<{ data: Row[] | null; error: { message: string } | null }>;
    });

    const byPerson: Record<string, { name: string; tag: string | null; count: number }> = {};
    for (const c of checkins) {
      const p = c.people;
      if (!p) continue;
      if (!byPerson[c.person_id]) {
        byPerson[c.person_id] = { name: p.name, tag: p.tag, count: 0 };
      }
      byPerson[c.person_id].count++;
    }

    return Object.values(byPerson)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  });

export const getCheckinsForExport = createServerFn({ method: "POST" })
  .inputValidator((input: DashboardInput) => input)
  .handler(async ({ data }) => {
    // Export NÃO inclui email — apenas dados operacionais necessários.
    type Row = {
      id: string;
      date: string;
      period: string;
      access_type: string;
      event_name: string | null;
      checked_in_at: string;
      people: { name: string; tag: string | null } | null;
    };
    return fetchAllRows<Row>((from, to) => {
      let q = supabaseAdmin
        .from("checkins")
        .select("id, date, period, access_type, event_name, checked_in_at, people(name, tag)")
        .gte("date", data.from)
        .lte("date", data.to)
        .order("date", { ascending: false })
        .order("checked_in_at", { ascending: false })
        .range(from, to);
      if (data.event_id) q = q.eq("event_id", data.event_id);
      return q as unknown as PromiseLike<{ data: Row[] | null; error: { message: string } | null }>;
    });
  });

export const getEventsForDashboard = createServerFn({ method: "POST" })
  .inputValidator((input: { from: string; to: string }) => input)
  .handler(async ({ data }) => {
    const { data: events, error } = await supabaseAdmin
      .from("events")
      .select("id, name, date")
      .gte("date", data.from)
      .lte("date", data.to)
      .order("date", { ascending: true });
    if (error) throw new Error(error.message);
    return events || [];
  });

export const getEventOperations = createServerFn({ method: "POST" })
  .inputValidator((input: EventOperationsInput) => input)
  .handler(async ({ data }) => {
    const attendancePage = data.attendance_page || 1;
    const absencesPage = data.absences_page || 1;
    const deniedPage = data.denied_page || 1;
    const pageSize = data.page_size || 10;

    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, name, date")
      .eq("id", data.event_id)
      .single();
    if (eventError) throw new Error(eventError.message);

    type RegistrationRow = {
      person_id: string;
      ticket_type: string;
      luma_guest_id: string | null;
      people: { name: string; tag: string | null } | null;
    };
    type CheckinRow = {
      id: string;
      person_id: string;
      checked_in_at: string;
      access_type: string;
      source: string;
      people: { name: string; tag: string | null } | null;
    };
    type DeniedRow = {
      id: string;
      occurred_at: string;
      door_id: string | null;
      device_id: string | null;
      reason: string | null;
      resolution_status: string;
      house_user_id: string | null;
      credential_type: string;
      people: { name: string; tag: string | null } | null;
    };

    const [registrations, checkins, deniedForEvent] = await Promise.all([
      fetchAllRows<RegistrationRow>((from, to) =>
        supabaseAdmin
          .from("registrations")
          .select("person_id, ticket_type, luma_guest_id, people(name, tag)")
          .eq("event_id", data.event_id)
          .order("imported_at", { ascending: true })
          .range(from, to) as unknown as PromiseLike<{
          data: RegistrationRow[] | null;
          error: { message: string } | null;
        }>,
      ),
      fetchAllRows<CheckinRow>((from, to) =>
        supabaseAdmin
          .from("checkins")
          .select("id, person_id, checked_in_at, access_type, source, people(name, tag)")
          .eq("event_id", data.event_id)
          .order("checked_in_at", { ascending: false })
          .range(from, to) as unknown as PromiseLike<{
          data: CheckinRow[] | null;
          error: { message: string } | null;
        }>,
      ),
      fetchAllRows<DeniedRow>((from, to) =>
        supabaseAdmin
          .from("house_access_logs_raw")
          .select(
            "id, occurred_at, door_id, device_id, reason, resolution_status, house_user_id, credential_type, people(name, tag)",
          )
          .eq("decision", "denied")
          .or(`resolved_event_id.eq.${data.event_id},provided_event_id.eq.${data.event_id}`)
          .order("occurred_at", { ascending: false })
          .range(from, to) as unknown as PromiseLike<{
          data: DeniedRow[] | null;
          error: { message: string } | null;
        }>,
      ),
    ]);

    const presentIds = new Set(checkins.map((row) => row.person_id));
    const attendees: EventAttendanceRow[] = checkins.map((row) => ({
      checkin_id: row.id,
      person_id: row.person_id,
      name: row.people?.name || "Pessoa sem nome",
      tag: row.people?.tag || null,
      checked_in_at: row.checked_in_at,
      access_type: row.access_type,
      source: row.source,
    }));

    const absences: EventOperationsPerson[] = registrations
      .filter((row) => !presentIds.has(row.person_id))
      .map((row) => ({
        person_id: row.person_id,
        name: row.people?.name || "Pessoa sem nome",
        tag: row.people?.tag || null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

    const denied: EventDeniedRow[] = deniedForEvent.map((row) => ({
      id: row.id,
      occurred_at: row.occurred_at,
      door_id: row.door_id,
      device_id: row.device_id,
      reason: row.reason,
      resolution_status: row.resolution_status,
      house_user_id: row.house_user_id,
      credential_type: row.credential_type,
      person_name: row.people?.name || null,
      person_tag: row.people?.tag || null,
    }));

    if (event.name === HOUSE_DEMO_EVENT_NAME) {
      const demoDenied = await fetchAllRows<DeniedRow>((from, to) =>
        supabaseAdmin
          .from("house_access_logs_raw")
          .select(
            "id, occurred_at, door_id, device_id, reason, resolution_status, house_user_id, credential_type, people(name, tag)",
          )
          .eq("decision", "denied")
          .contains("raw_payload", { demo_marker: HOUSE_DEMO_MARKER })
          .gte("occurred_at", `${event.date}T00:00:00-03:00`)
          .lte("occurred_at", `${event.date}T23:59:59-03:00`)
          .order("occurred_at", { ascending: false })
          .range(from, to) as unknown as PromiseLike<{
          data: DeniedRow[] | null;
          error: { message: string } | null;
        }>,
      );

      const seen = new Set(denied.map((row) => row.id));
      for (const row of demoDenied) {
        if (seen.has(row.id)) continue;
        denied.push({
          id: row.id,
          occurred_at: row.occurred_at,
          door_id: row.door_id,
          device_id: row.device_id,
          reason: row.reason,
          resolution_status: row.resolution_status,
          house_user_id: row.house_user_id,
          credential_type: row.credential_type,
          person_name: row.people?.name || null,
          person_tag: row.people?.tag || null,
        });
      }

      denied.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
    }

    return {
      event,
      summary: {
        registrations: registrations.length,
        attendees: attendees.length,
        absences: absences.length,
        denied: denied.length,
      },
      attendees: paginateRows(attendees, attendancePage, pageSize),
      absences: paginateRows(absences, absencesPage, pageSize),
      denied: paginateRows(denied, deniedPage, pageSize),
    };
  });
