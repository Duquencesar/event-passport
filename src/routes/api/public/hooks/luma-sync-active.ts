/**
 * Endpoint chamado pelo cron de 30s para sincronizar APENAS eventos ativos no momento.
 * Bem mais leve que o sync completo — não bate o rate limit do Luma.
 *
 * Janela de "ativo": eventos de hoje, entre (start - 1h) e (start + 8h).
 */

import { createFileRoute } from "@tanstack/react-router";
import { syncActiveEvents } from "@/server/luma.server";

export const Route = createFileRoute("/api/public/hooks/luma-sync-active")({
  server: {
    handlers: {
      POST: async () => {
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

        try {
          const result = await syncActiveEvents({
            apiKey,
            calendarApiId: calendarId,
          });
          if (result.events_processed > 0) {
            console.log("Luma sync (active) ok:", JSON.stringify(result.totals));
          }
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Luma sync (active) error:", err);
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