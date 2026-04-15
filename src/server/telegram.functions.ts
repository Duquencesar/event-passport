import { createServerFn } from "@tanstack/react-start";
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
  const today = new Date().toISOString().split("T")[0];

  // Total registrations (all time)
  const { count: totalRegistrations } = await supabaseAdmin
    .from("registrations")
    .select("id", { count: "exact", head: true });

  // Total unique people registered
  const { count: totalPeople } = await supabaseAdmin
    .from("people")
    .select("id", { count: "exact", head: true });

  // Architects registered
  const { count: architects } = await supabaseAdmin
    .from("people")
    .select("id", { count: "exact", head: true })
    .eq("tag", "Arquiteto");

  // Today's check-ins
  const { count: todayCheckins } = await supabaseAdmin
    .from("checkins")
    .select("id", { count: "exact", head: true })
    .eq("date", today);

  // Today's unique people checked in
  const { data: todayPeople } = await supabaseAdmin
    .from("checkins")
    .select("person_id")
    .eq("date", today);
  const uniqueToday = new Set(todayPeople?.map((c) => c.person_id)).size;

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

  return lines.join("\n");
}

async function handleIncomingMessage(chatId: number, text: string | null) {
  const cmd = (text || "").trim().toLowerCase();

  if (cmd === "/start" || cmd === "/help") {
    await sendTelegramMessage(
      chatId,
      `🌿 <b>Ipê Village Bot</b>\n\nComandos:\n/resumo — Relatório diário (inscritos + check-ins)\n/help — Mostra esta mensagem`,
    );
    return;
  }

  if (cmd === "/resumo" || cmd === "/relatorio" || cmd === "/report") {
    const report = await buildDailyReport();
    await sendTelegramMessage(chatId, report);
    return;
  }

  // Default: send report
  const report = await buildDailyReport();
  await sendTelegramMessage(chatId, report);
}

export const pollTelegram = createServerFn({ method: "POST" }).handler(
  async () => {
    const { LOVABLE_API_KEY, TELEGRAM_API_KEY } = getKeys();

    // Get current offset
    const { data: state } = await supabaseAdmin
      .from("telegram_bot_state")
      .select("update_offset")
      .eq("id", 1)
      .single();

    const currentOffset = state?.update_offset || 0;

    // Long poll (30s timeout for server function safety)
    const res = await fetch(`${GATEWAY_URL}/getUpdates`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offset: currentOffset,
        timeout: 5,
        allowed_updates: ["message"],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        `getUpdates failed [${res.status}]: ${JSON.stringify(data)}`,
      );
    }

    const updates = (data as { result?: Array<{ update_id: number; message?: { chat: { id: number }; text?: string } }> }).result ?? [];
    if (updates.length === 0) {
      return { ok: true, processed: 0 };
    }

    let processed = 0;

    for (const u of updates) {
      if (u.message) {
        // Store message
        await supabaseAdmin.from("telegram_messages").upsert(
          [
            {
              update_id: u.update_id,
              chat_id: u.message.chat.id,
              text: u.message.text ?? null,
              raw_update: u as unknown as Record<string, unknown>,
            },
          ],
          { onConflict: "update_id" },
        );

        // Respond
        await handleIncomingMessage(u.message.chat.id, u.message.text ?? null);
        processed++;
      }
    }

    // Update offset
    const newOffset =
      Math.max(...updates.map((u) => u.update_id)) + 1;
    await supabaseAdmin
      .from("telegram_bot_state")
      .update({
        update_offset: newOffset,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    return { ok: true, processed, newOffset };
  },
);
