import { createFileRoute } from "@tanstack/react-router";
import { assertHouseApiRequest } from "@/server/house.server";

function normalizeLumaLookupId(input: string): string {
  const value = input.trim();
  if (!value) return value;

  try {
    const url = new URL(value);
    const pk = url.searchParams.get("pk");
    if (pk) return pk;
  } catch {
    // Not a URL, use the raw identifier.
  }

  return value;
}

async function lookupLumaGuest(input: {
  apiKey: string;
  id: string;
  eventId?: string;
}): Promise<Record<string, unknown>> {
  const url = new URL("https://public-api.luma.com/v1/event/get-guest");
  url.searchParams.set("id", normalizeLumaLookupId(input.id));
  if (input.eventId) {
    url.searchParams.set("event_id", input.eventId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      "x-luma-api-key": input.apiKey,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Luma API ${response.status}: ${body}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
}

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