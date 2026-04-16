import { createServerFn } from "@tanstack/react-start";
import { db as supabaseAdmin } from "./db";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withAuthHeaders } from "@/middleware/auth-client";

type DashboardInput = { from: string; to: string; event_id?: string };

export const getDashboardStats = createServerFn({ method: "POST" })
  .middleware([withAuthHeaders, requireSupabaseAuth])
  .inputValidator((input: DashboardInput) => input)
  .handler(async ({ data }) => {
    let q1 = supabaseAdmin
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .gte("date", data.from)
      .lte("date", data.to);
    if (data.event_id) q1 = q1.eq("event_id", data.event_id);
    const { count: totalCheckins } = await q1;

    let q2 = supabaseAdmin
      .from("checkins")
      .select("person_id")
      .gte("date", data.from)
      .lte("date", data.to);
    if (data.event_id) q2 = q2.eq("event_id", data.event_id);
    const { data: uniqueData } = await q2;
    const uniquePeople = new Set(uniqueData?.map((c) => c.person_id)).size;

    let q3 = supabaseAdmin
      .from("checkins")
      .select("person_id, people!inner(tag)")
      .gte("date", data.from)
      .lte("date", data.to)
      .eq("people.tag", "Arquiteto");
    if (data.event_id) q3 = q3.eq("event_id", data.event_id);
    const { data: archData } = await q3;
    const architects = new Set(archData?.map((c) => c.person_id)).size;

    return { totalCheckins: totalCheckins || 0, uniquePeople, architects };
  });

export const getDailyAttendance = createServerFn({ method: "POST" })
  .middleware([withAuthHeaders, requireSupabaseAuth])
  .inputValidator((input: DashboardInput) => input)
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("checkins")
      .select("date, id")
      .gte("date", data.from)
      .lte("date", data.to);
    if (data.event_id) q = q.eq("event_id", data.event_id);
    const { data: checkins } = await q;

    const byDate: Record<string, number> = {};
    for (const c of checkins || []) {
      byDate[c.date] = (byDate[c.date] || 0) + 1;
    }

    return Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  });

export const getAccessTypeBreakdown = createServerFn({ method: "POST" })
  .middleware([withAuthHeaders, requireSupabaseAuth])
  .inputValidator((input: DashboardInput) => input)
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("checkins")
      .select("access_type")
      .gte("date", data.from)
      .lte("date", data.to);
    if (data.event_id) q = q.eq("event_id", data.event_id);
    const { data: checkins } = await q;

    const byType: Record<string, number> = {};
    for (const c of checkins || []) {
      byType[c.access_type] = (byType[c.access_type] || 0) + 1;
    }

    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  });

export const getTopAttendees = createServerFn({ method: "POST" })
  .middleware([withAuthHeaders, requireSupabaseAuth])
  .inputValidator((input: DashboardInput) => input)
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("checkins")
      .select("person_id, people(name, email, tag)")
      .gte("date", data.from)
      .lte("date", data.to);
    if (data.event_id) q = q.eq("event_id", data.event_id);
    const { data: checkins } = await q;

    const byPerson: Record<string, { name: string; email: string; tag: string | null; count: number }> = {};
    for (const c of checkins || []) {
      const p = c.people as unknown as { name: string; email: string; tag: string | null };
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
  .middleware([withAuthHeaders, requireSupabaseAuth])
  .inputValidator((input: DashboardInput) => input)
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("checkins")
      .select("id, date, period, access_type, event_name, checked_in_at, people(name, email, tag)")
      .gte("date", data.from)
      .lte("date", data.to)
      .order("date", { ascending: false })
      .order("checked_in_at", { ascending: false });
    if (data.event_id) q = q.eq("event_id", data.event_id);
    const { data: checkins, error } = await q;
    if (error) throw new Error(error.message);
    return checkins || [];
  });

export const getEventsForDashboard = createServerFn({ method: "POST" })
  .middleware([withAuthHeaders, requireSupabaseAuth])
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
