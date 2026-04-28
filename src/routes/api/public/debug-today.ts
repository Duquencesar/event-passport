import { createFileRoute } from "@tanstack/react-router";
import { getCurrentBrasiliaDateKeySync } from "@/lib/brasilia-time";

export const Route = createFileRoute("/api/public/debug-today")({
  server: {
    handlers: {
      GET: async () => {
        const todayKey = getCurrentBrasiliaDateKeySync();
        const utc = new Date().toISOString();
        return new Response(JSON.stringify({ todayKey, utc }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
