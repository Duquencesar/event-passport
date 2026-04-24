/**
 * Hook chamado pelo cron horário (pg_cron + pg_net) para sincronizar
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

        if (!apiKey || !calendarId) {
          return new Response(
            JSON.stringify({
              error:
                "LUMA_API_KEY ou LUMA_CALENDAR_API_ID não configurados nos secrets.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        try {
          // Lê opcional sinceDate do body; default = 1º de janeiro do ano atual
          let sinceDate: string | undefined;
          let untilDate: string | undefined;
          try {
            const body = (await request.clone().json()) as { sinceDate?: string; untilDate?: string };
            sinceDate = body?.sinceDate;
            untilDate = body?.untilDate;
          } catch {
            // body vazio é OK
          }
          if (!sinceDate) {
            sinceDate = `${new Date().getUTCFullYear()}-01-01`;
          }

          const result = await syncEntireCalendar({
            apiKey,
            calendarApiId: calendarId,
            sinceDate,
            untilDate,
          });
          console.log("Luma sync ok:", JSON.stringify(result.totals));
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Luma sync error:", err);
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
