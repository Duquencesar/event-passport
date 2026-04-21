/**
 * Hook chamado pelo cron horário para sincronizar
 * eventos, inscritos e check-ins do Luma com o banco local.
 *
 * Pode também ser chamado manualmente com Bearer token (anon key).
 */

import { createFileRoute } from "@tanstack/react-router";
import { syncEntireCalendar } from "@/server/luma.server";

export const Route = createFileRoute("/hooks/luma-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const lovableContext = request.headers.get("lovable-context");
        const authHeader = request.headers.get("authorization");

        // Permite chamada do cron OU com bearer
        if (lovableContext !== "cron") {
          const token = authHeader?.replace("Bearer ", "");
          if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        const apiKey = process.env.LUMA_API_KEY;
        const calendarId = process.env.LUMA_CALENDAR_API_ID;

        if (!apiKey) {
          return new Response(
            JSON.stringify({
              error: "LUMA_API_KEY não configurada nos secrets.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
          const result = await syncEntireCalendar({
            apiKey,
            calendarApiId: calendarId,
          });
          console.log("Luma sync ok:", JSON.stringify(result.totals));
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Luma sync error:", err);
          return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
