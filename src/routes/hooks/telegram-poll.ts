import { createFileRoute } from "@tanstack/react-router";
import { pollTelegram } from "@/server/telegram.functions";

export const Route = createFileRoute("/hooks/telegram-poll")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        const lovableContext = request.headers.get("lovable-context");

        // Allow cron or Bearer auth
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
          const result = await pollTelegram();
          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Telegram poll error:", err);
          return new Response(
            JSON.stringify({ error: String(err) }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
