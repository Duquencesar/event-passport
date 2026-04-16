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

async function buildPeriodReport(period: "morning" | "afternoon"): Promise<string> {
  const today = await getBrasiliaTodayKey();
  const isMorning = period === "morning";
  const periodLabel = isMorning ? "Manhã" : "Tarde";
  const periodEmoji = isMorning ? "🌅" : "🌇";
  // Morning: events starting before 13:00, Afternoon: 13:00+
  const cutoff = 13 * 60; // 13:00 in minutes

  const { count: todayCheckins } = await supabaseAdmin
    .from("checkins")
    .select("id", { count: "exact", head: true })
    .eq("date", today);

  const { data: todayPeople } = await supabaseAdmin
    .from("checkins")
    .select("person_id")
    .eq("date", today);
  const uniqueToday = new Set(todayPeople?.map((c) => c.person_id)).size;

  const { data: allTodayEvents } = await supabaseAdmin
    .from("events")
    .select("id, name, time, location")
    .eq("date", today)
    .order("time", { ascending: true });

  // Filter events by period
  const periodEvents = (allTodayEvents || []).filter((ev) => {
    const mins = parseTime(ev.time);
    return isMorning ? mins < cutoff : mins >= cutoff;
  });

  const lines = [
    `${periodEmoji} <b>Ipê Village — Relatório ${periodLabel}</b>`,
    `📅 ${today}`,
    ``,
    `✅ <b>Check-ins Hoje (acumulado)</b>`,
    `• Check-ins: ${todayCheckins || 0} | Pessoas únicas: ${uniqueToday}`,
  ];

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
