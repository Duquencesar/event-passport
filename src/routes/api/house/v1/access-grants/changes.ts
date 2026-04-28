import { createFileRoute } from "@tanstack/react-router";
import { assertHouseApiRequest, getHouseGrantChanges } from "@/server/house.server";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/house/v1/access-grants/changes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          assertHouseApiRequest(request);
          const url = new URL(request.url);
          const cursor = url.searchParams.get("cursor");
          return json(await getHouseGrantChanges(cursor));
        } catch (err) {
          if (err instanceof Response) return err;
          const message = err instanceof Error ? err.message : "Internal server error";
          const status = message.includes("Cursor inválido") ? 400 : 500;
          if (status === 500) {
            console.error("house grant changes error:", err);
          }
          return json({ error: message }, status);
        }
      },
    },
  },
});