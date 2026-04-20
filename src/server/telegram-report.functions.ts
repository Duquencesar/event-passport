import { createServerFn } from "@tanstack/react-start";
import { getBrasiliaTodayKey } from "@/lib/brasilia-time";
import { db as supabaseAdmin } from "./db";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function getKeys() {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
  if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");
  return { LOVABLE_API_KEY, TELEGRAM_API_KEY };
}

async function sendTelegramMessage(chatId: number, text: string) {
  const { LOVABLE_API_KEY, TELEGRAM_API_KEY } = getKeys();
  const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`Telegram sendMessage failed [${res.status}]: ${err}`);
  }
}

function parseTime(timeStr: string | null): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

/** Retorna se a data `today` (YYYY-MM-DD) cai dentro da semana do passe semanal */
function isWeeklyActive(weeklyStartDate: string, today: string): boolean {
  const start = new Date(weeklyStartDate + "T12:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const todayDate = new Date(today + "T12:00:00");
  return todayDate >= start && todayDate <= end;
}

async function buildPeriodReport(period: "morning" | "afternoon"): Promise<string> {
  const today = await getBrasiliaTodayKey();
  const isMorning = period === "morning";
  const periodLabel = isMorning ? "Manhã" : "Tarde";
  const periodEmoji = isMorning ? "🌅" : "🌇";
  const cutoff = 13 * 60; // 13:00 em minutos

  // ── Check-ins do dia ──────────────────────────────────────────────────────
  const { count: todayCheckins } = await supabaseAdmin
    .from("checkins")
    .select("id", { count: "exact", head: true })
    .eq("date", today);

  const { data: todayPeopleData } = await supabaseAdmin
    .from("checkins")
    .select("person_id")
    .eq("date", today);
  const uniqueToday = new Set(todayPeopleData?.map((c) => c.person_id)).size;

  // ── Breakdown por tag (quem fez check-in hoje) ───────────────────────────
  const { data: tagCheckins } = await supabaseAdmin
    .from("checkins")
    .select("person_id, people!inner(tag)")
    .eq("date", today);

  const tagBreakdown: Record<string, Set<string>> = {};
  for (const c of tagCheckins || []) {
    const tag = (c.people as any)?.tag || "Geral";
    if (!tagBreakdown[tag]) tagBreakdown[tag] = new Set();
    tagBreakdown[tag].add(c.person_id);
  }

  // ── Day Pass válidos hoje ─────────────────────────────────────────────────
  const { count: dayPassValid } = await supabaseAdmin
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("day_pass_date", today);

  // ── Passes Semanais ativos hoje ───────────────────────────────────────────
  const { data: weeklyRegs } = await supabaseAdmin
    .from("registrations")
    .select("person_id, week_pass_start_date")
    .not("week_pass_start_date", "is", null);

  const weeklyActiveIds = new Set(
    (weeklyRegs || [])
      .filter((r) => r.week_pass_start_date && isWeeklyActive(r.week_pass_start_date, today))
      .map((r) => r.person_id)
  );

  // ── Totais de cadastro ────────────────────────────────────────────────────
  const [
    { count: totalArquitetos },
    { count: totalExplorers },
    { count: totalWeekly },
  ] = await Promise.all([
    supabaseAdmin.from("people").select("id", { count: "exact", head: true }).eq("tag", "Arquiteto"),
    supabaseAdmin.from("people").select("id", { count: "exact", head: true }).eq("tag", "Explorer"),
    supabaseAdmin.from("people").select("id", { count: "exact", head: true }).eq("tag", "Weekly"),
  ]);

  // ── Eventos do período ────────────────────────────────────────────────────
  const { data: allTodayEvents } = await supabaseAdmin
    .from("events")
    .select("id, name, time, location")
    .eq("date", today)
    .order("time", { ascending: true });

  const periodEvents = (allTodayEvents || []).filter((ev) => {
    const mins = parseTime(ev.time);
    return isMorning ? mins < cutoff : mins >= cutoff;
  });

  // ── Monta mensagem ────────────────────────────────────────────────────────
  const lines = [
    `${periodEmoji} <b>Ipê Village — Relatório ${periodLabel}</b>`,
    `📅 ${today}`,
    ``,
    `✅ <b>Check-ins Hoje (acumulado)</b>`,
    `• Total: ${todayCheckins || 0} | Pessoas únicas: ${uniqueToday}`,
  ];

  // Breakdown por categoria
  const arquitetosCheckin = tagBreakdown["Arquiteto"]?.size || 0;
  const explorersCheckin  = tagBreakdown["Explorer"]?.size || 0;
  const weeklyCheckin     = tagBreakdown["Weekly"]?.size || 0;
  const dayPassCheckin    = tagBreakdown["Day Pass"]?.size || 0;
  const geralCheckin      = tagBreakdown["Geral"]?.size || 0;

  if (uniqueToday > 0) {
    lines.push(``, `📊 <b>Por categoria (check-ins)</b>`);
    if (arquitetosCheckin > 0) lines.push(`• 🏛 Arquitetos: ${arquitetosCheckin}`);
    if (explorersCheckin  > 0) lines.push(`• 🧭 Explorers: ${explorersCheckin}`);
    if (weeklyCheckin     > 0) lines.push(`• 📆 Passe Semanal: ${weeklyCheckin}`);
    if (dayPassCheckin    > 0) lines.push(`• 🎫 Day Pass: ${dayPassCheckin}`);
    if (geralCheckin      > 0) lines.push(`• 👤 Geral: ${geralCheckin}`);
  }

  // Capacidade de acesso hoje
  lines.push(``, `🔑 <b>Acessos válidos hoje</b>`);
  lines.push(`• 🏛 Arquitetos: ${totalArquitetos || 0} cadastrados`);
  lines.push(`• 🧭 Explorers: ${totalExplorers || 0} cadastrados`);
  lines.push(`• 📆 Passes Semanais ativos: ${weeklyActiveIds.size} (${totalWeekly || 0} totais)`);
  lines.push(`• 🎫 Day Passes válidos hoje: ${dayPassValid || 0}`);

  // Eventos do período
  if (periodEvents.length > 0) {
    lines.push(``, `📆 <b>Eventos — ${periodLabel}</b>`);
    for (const ev of periodEvents) {
      const { count: evCheckins } = await supabaseAdmin
        .from("checkins")
        .select("id", { count: "exact", head: true })
        .eq("event_id", ev.id);
      const { count: evRegs } = await supabaseAdmin
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", ev.id);
      lines.push(
        `• ${ev.time || "?"} — <b>${ev.name}</b>`,
        `  📍 ${ev.location || "—"} | 📝 ${evRegs || 0} inscritos | ✅ ${evCheckins || 0} check-ins`,
      );
    }
  } else {
    lines.push(``, `📆 Nenhum evento na ${periodLabel.toLowerCase()} de hoje.`);
  }

  return lines.join("\n");
}

export const sendDailyReport = createServerFn({ method: "POST" })
  .inputValidator((input: { period: "morning" | "afternoon" }) => input)
  .handler(async ({ data }) => {
    const { data: chats, error } = await supabaseAdmin
      .from("telegram_messages")
      .select("chat_id");

    if (error) throw new Error(`Failed to get chats: ${error.message}`);

    const uniqueChatIds = [...new Set(chats?.map((c) => c.chat_id) || [])];

    if (uniqueChatIds.length === 0) {
      return { ok: true, sent: 0, message: "No chats to send to" };
    }

    const report = await buildPeriodReport(data.period);
    let sent = 0;
    const errors: string[] = [];

    for (const chatId of uniqueChatIds) {
      try {
        await sendTelegramMessage(chatId, report);
        sent++;
      } catch (err) {
        errors.push(`chat ${chatId}: ${err}`);
      }
    }

    return { ok: true, sent, total: uniqueChatIds.length, period: data.period, errors };
  });
