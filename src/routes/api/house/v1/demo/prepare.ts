import { createFileRoute } from "@tanstack/react-router";
import { assertHouseApiRequest, prepareHouseDemo } from "@/server/house.server";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/house/v1/demo/prepare")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          assertHouseApiRequest(request);
          return json(await prepareHouseDemo());
        } catch (err) {
          if (err instanceof Response) return err;
          console.error("house demo prepare error:", err);
          return json({ error: "Internal server error" }, 500);
        }
      },
    },
  },
});
