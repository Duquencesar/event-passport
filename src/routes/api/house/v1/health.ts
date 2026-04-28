import { createFileRoute } from "@tanstack/react-router";
import { assertHouseApiRequest, getHouseHealth } from "@/server/house.server";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/house/v1/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          assertHouseApiRequest(request);
          return json(await getHouseHealth());
        } catch (err) {
          if (err instanceof Response) return err;
          console.error("house health error:", err);
          return json({ error: "Internal server error" }, 500);
        }
      },
    },
  },
});