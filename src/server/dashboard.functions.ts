import { createServerFn } from "@tanstack/react-start";
import { db as supabaseAdmin } from "./db";
import { fetchAllRows } from "./pagination";

type DashboardInput = { from: string; to: string; event_id?: string };

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
      people: { name: string; email: string; tag: string | null } | null;
    };
    const checkins = await fetchAllRows<Row>((from, to) => {
      let q = supabaseAdmin
        .from("checkins")
        .select("person_id, people(name, email, tag)")
        .gte("date", data.from)
        .lte("date", data.to)
        .range(from, to);
      if (data.event_id) q = q.eq("event_id", data.event_id);
      return q as unknown as PromiseLike<{ data: Row[] | null; error: { message: string } | null }>;
    });

    const byPerson: Record<string, { name: string; email: string; tag: string | null; count: number }> = {};
    for (const c of checkins) {
      const p = c.people;
      if (!p) continue;
      if (!byPerson[c.person_id]) {
        byPerson[c.person_id] = { name: p.name, email: p.email, tag: p.tag, count: 0 };
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
    type Row = {
      id: string;
      date: string;
      period: string;
      access_type: string;
      event_name: string | null;
      checked_in_at: string;
      people: { name: string; email: string; tag: string | null } | null;
    };
    return fetchAllRows<Row>((from, to) => {
      let q = supabaseAdmin
        .from("checkins")
        .select("id, date, period, access_type, event_name, checked_in_at, people(name, email, tag)")
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
