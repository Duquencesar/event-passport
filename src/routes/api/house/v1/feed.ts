import { createFileRoute } from "@tanstack/react-router";
import {
  assertHouseApiRequest,
  getHouseBootstrap,
  getHouseGrantChanges,
} from "@/server/house.server";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/house/v1/feed")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          assertHouseApiRequest(request);
          const url = new URL(request.url);
          const cursor = url.searchParams.get("cursor");
          const payload = cursor ? await getHouseGrantChanges(cursor) : await getHouseBootstrap();
          return json(payload);
        } catch (err) {
          if (err instanceof Response) return err;
          const message = err instanceof Error ? err.message : "Internal server error";
          const status = message.includes("Cursor inválido") ? 400 : 500;
          if (status === 500) {
            console.error("house feed error:", err);
          }
          return json({ error: message }, status);
        }
      },
    },
  },
});
