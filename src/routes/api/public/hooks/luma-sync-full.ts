/**
 * Endpoint chamado pelo cron de 5 min para sincronizar TUDO
 * (eventos + inscritos + check-ins) na janela padrão (últimos 7 dias + futuro).
 */

import { createFileRoute } from "@tanstack/react-router";
import { syncEntireCalendar } from "@/server/luma.server";

export const Route = createFileRoute("/api/public/hooks/luma-sync-full")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LUMA_API_KEY;
        const calendarId = process.env.LUMA_CALENDAR_API_ID;

        if (!apiKey || !calendarId) {
          return new Response(
            JSON.stringify({
              error: "LUMA_API_KEY ou LUMA_CALENDAR_API_ID não configurados.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        let sinceDate: string | undefined;
        let untilDate: string | undefined;
        try {
          const body = (await request.clone().json()) as {
            sinceDate?: string;
            untilDate?: string;
          };
          sinceDate = body?.sinceDate;
          untilDate = body?.untilDate;
        } catch {
          // body vazio é OK
        }

        try {
          const result = await syncEntireCalendar({
            apiKey,
            calendarApiId: calendarId,
            sinceDate,
            untilDate,
          });
          console.log("Luma sync (full) ok:", JSON.stringify(result.totals));
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Luma sync (full) error:", err);
          const message = err instanceof Error ? err.message : "Internal error";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});