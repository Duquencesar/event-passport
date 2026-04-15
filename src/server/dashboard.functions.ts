import { createServerFn } from "@tanstack/react-start";
import { db as supabaseAdmin } from "./db";

export const getDashboardStats = createServerFn({ method: "POST" })
  .inputValidator((input: { from: string; to: string }) => input)
  .handler(async ({ data }) => {
    // Total checkins in range
    const { count: totalCheckins } = await supabaseAdmin
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .gte("date", data.from)
      .lte("date", data.to);

    // Unique people
    const { data: uniqueData } = await supabaseAdmin
      .from("checkins")
      .select("person_id")
      .gte("date", data.from)
      .lte("date", data.to);

    const uniquePeople = new Set(uniqueData?.map((c) => c.person_id)).size;

    // Architects active
    const { data: archData } = await supabaseAdmin
      .from("checkins")
      .select("person_id, people!inner(tag)")
      .gte("date", data.from)
      .lte("date", data.to)
      .eq("people.tag", "Arquiteto");

    const architects = new Set(archData?.map((c) => c.person_id)).size;

    return {
      totalCheckins: totalCheckins || 0,
      uniquePeople,
      architects,
    };
  });

export const getDailyAttendance = createServerFn({ method: "POST" })
  .inputValidator((input: { from: string; to: string }) => input)
  .handler(async ({ data }) => {
    const { data: checkins } = await supabaseAdmin
      .from("checkins")
      .select("date, id")
      .gte("date", data.from)
      .lte("date", data.to);

    const byDate: Record<string, number> = {};
    for (const c of checkins || []) {
      byDate[c.date] = (byDate[c.date] || 0) + 1;
    }

    return Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  });

export const getAccessTypeBreakdown = createServerFn({ method: "POST" })
  .inputValidator((input: { from: string; to: string }) => input)
  .handler(async ({ data }) => {
    const { data: checkins } = await supabaseAdmin
      .from("checkins")
      .select("access_type")
      .gte("date", data.from)
      .lte("date", data.to);

    const byType: Record<string, number> = {};
    for (const c of checkins || []) {
      byType[c.access_type] = (byType[c.access_type] || 0) + 1;
    }

    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  });

export const getTopAttendees = createServerFn({ method: "POST" })
  .inputValidator((input: { from: string; to: string }) => input)
  .handler(async ({ data }) => {
    const { data: checkins } = await supabaseAdmin
      .from("checkins")
      .select("person_id, people(name, email, tag)")
      .gte("date", data.from)
      .lte("date", data.to);

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
