import { createFileRoute } from "@tanstack/react-router";
import { assertHouseApiRequest } from "@/server/house.server";
import { lookupLumaGuest, normalizeLumaLookupId } from "@/server/luma.server";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/house/v1/luma-guest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          assertHouseApiRequest(request);
          const apiKey = process.env.LUMA_API_KEY;
          if (!apiKey) {
            return json({ error: "LUMA_API_KEY não configurada." }, 500);
          }

          const url = new URL(request.url);
          const rawId = url.searchParams.get("id");
          const eventId = url.searchParams.get("event_id") || undefined;

          if (!rawId?.trim()) {
            return json({ error: "Query param obrigatório: id" }, 400);
          }

          const normalizedId = normalizeLumaLookupId(rawId);
          const guest = await lookupLumaGuest({
            apiKey,
            id: normalizedId,
            eventId,
          });

          return json({
            lookup_id: normalizedId,
            event_id: eventId ?? null,
            guest,
          });
        } catch (err) {
          if (err instanceof Response) return err;
          console.error("house luma guest lookup error:", err);
          return json({ error: "Internal server error" }, 500);
        }
      },
    },
  },
});
