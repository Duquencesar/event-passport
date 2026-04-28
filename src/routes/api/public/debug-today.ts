import { createFileRoute } from "@tanstack/react-router";
import { getCurrentBrasiliaDateKeySync } from "@/lib/brasilia-time";

export const Route = createFileRoute("/api/public/debug-today")({
  server: {
    handlers: {
      GET: async () => {
        const todayKey = getCurrentBrasiliaDateKeySync();
        const utc = new Date().toISOString();
        const sp = new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Sao_Paulo",
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", hour12: false,
        }).format(new Date());
        return new Response(JSON.stringify({ todayKey, utc, sp }, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
