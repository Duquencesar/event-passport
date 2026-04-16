import { createFileRoute } from "@tanstack/react-router";
import { sendDailyReport } from "@/server/telegram-report.functions";

export const Route = createFileRoute("/hooks/telegram-daily-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const lovableContext = request.headers.get("lovable-context");
        const authHeader = request.headers.get("authorization");

        if (lovableContext !== "cron") {
          const token = authHeader?.replace("Bearer ", "");
          if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        try {
          const body = await request.json() as { period?: string };
          const period = body.period === "afternoon" ? "afternoon" : "morning";
          const result = await sendDailyReport({ data: { period } });
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Daily report error:", err);
          return new Response(
            JSON.stringify({ error: String(err) }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
