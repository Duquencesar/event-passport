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

async function buildDailyReport(): Promise<string> {
  const today = await getBrasiliaTodayKey();

  const { count: totalPeople } = await supabaseAdmin
    .from("people")
    .select("id", { count: "exact", head: true });

  const { count: architects } = await supabaseAdmin
    .from("people")
    .select("id", { count: "exact", head: true })
    .eq("tag", "Arquiteto");

  const { count: totalRegistrations } = await supabaseAdmin
    .from("registrations")
    .select("id", { count: "exact", head: true });

  const { count: todayCheckins } = await supabaseAdmin
    .from("checkins")
    .select("id", { count: "exact", head: true })
    .eq("date", today);

  const { data: todayPeople } = await supabaseAdmin
    .from("checkins")
    .select("person_id")
    .eq("date", today);
  const uniqueToday = new Set(todayPeople?.map((c) => c.person_id)).size;

  const { data: todayEvents } = await supabaseAdmin
    .from("events")
    .select("id, name, time, location")
    .eq("date", today)
    .order("time", { ascending: true });

  const lines = [
    `🌿 <b>Ipê Village — Relatório Diário</b>`,
    `📅 ${today}`,
    ``,
    `📋 <b>Inscritos</b>`,
    `• Total de pessoas: ${totalPeople || 0}`,
    `• Arquitetos: ${architects || 0}`,
    `• Inscrições (registros): ${totalRegistrations || 0}`,
    ``,
    `✅ <b>Check-ins Hoje</b>`,
    `• Check-ins realizados: ${todayCheckins || 0}`,
    `• Pessoas únicas: ${uniqueToday}`,
  ];

  if (todayEvents && todayEvents.length > 0) {
    lines.push(``, `📆 <b>Eventos Hoje</b>`);
    for (const ev of todayEvents) {
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
  }

  return lines.join("\n");
}

export const sendDailyReport = createServerFn({ method: "POST" }).handler(
  async () => {
    // Get all unique chat_ids from telegram_messages
    const { data: chats, error } = await supabaseAdmin
      .from("telegram_messages")
      .select("chat_id");

    if (error) throw new Error(`Failed to get chats: ${error.message}`);

    const uniqueChatIds = [...new Set(chats?.map((c) => c.chat_id) || [])];

    if (uniqueChatIds.length === 0) {
      return { ok: true, sent: 0, message: "No chats to send to" };
    }

    const report = await buildDailyReport();
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

    return { ok: true, sent, total: uniqueChatIds.length, errors };
  },
);
