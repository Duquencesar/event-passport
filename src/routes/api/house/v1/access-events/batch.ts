import { createFileRoute } from "@tanstack/react-router";
import {
  assertHouseApiRequest,
  ingestHouseAccessEvents,
  type HouseAccessEventInput,
} from "@/server/house.server";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/house/v1/access-events/batch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          assertHouseApiRequest(request);
          const body = (await request.json()) as { events?: HouseAccessEventInput[] };
          if (!Array.isArray(body.events)) {
            return json({ error: "Body inválido. Esperado: { events: [] }" }, 400);
          }
          return json(await ingestHouseAccessEvents({ events: body.events }));
        } catch (err) {
          if (err instanceof Response) return err;
          console.error("house access events error:", err);
          return json({ error: "Internal server error" }, 500);
        }
      },
    },
  },
});
