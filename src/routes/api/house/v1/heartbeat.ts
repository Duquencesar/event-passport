import { createFileRoute } from "@tanstack/react-router";
import { assertHouseApiRequest, recordHouseHeartbeat } from "@/server/house.server";
import type { Json } from "@/integrations/supabase/types";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/house/v1/heartbeat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          assertHouseApiRequest(request);
          const body = (await request.json()) as {
            device_id?: string;
            label?: string | null;
            metadata?: Json;
          };
          if (!body.device_id?.trim()) {
            return json({ error: "device_id é obrigatório" }, 400);
          }
          return json(
            await recordHouseHeartbeat({
              device_id: body.device_id.trim(),
              label: body.label ?? null,
              metadata: body.metadata ?? {},
            }),
          );
        } catch (err) {
          if (err instanceof Response) return err;
          console.error("house heartbeat error:", err);
          return json({ error: "Internal server error" }, 500);
        }
      },
    },
  },
});
