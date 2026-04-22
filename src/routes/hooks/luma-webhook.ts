import { createFileRoute } from "@tanstack/react-router";
import {
  createLumaWebhookAudit,
  syncEntireCalendar,
  syncLumaEventByExternalId,
  updateLumaWebhookAudit,
} from "@/server/luma.server";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of headers.entries()) {
    if (key === "authorization") continue;
    out[key] = value;
  }
  return out;
}

function extractEventType(payload: unknown): string | null {
  const root = getObject(payload);
  if (!root) return null;
  const candidates = [root.type, root.event_type, root.event, root.action, root.topic, root.name];
  for (const candidate of candidates) {
    const value = readString(candidate);
    if (value) return value;
  }
  const data = getObject(root.data);
  if (!data) return null;
  for (const candidate of [data.type, data.event_type, data.action, data.topic, data.name]) {
    const value = readString(candidate);
    if (value) return value;
  }
  return null;
}

function extractLumaEventId(payload: unknown): string | null {
  const root = getObject(payload);
  if (!root) return null;

  const directCandidates = [
    root.luma_event_id,
    root.event_id,
    root.event_api_id,
    root.resource_id,
  ];
  for (const candidate of directCandidates) {
    const value = readString(candidate);
    if (value) return value;
  }

  const nestedKeys = ["event", "data", "guest", "registration", "payload"];
  for (const key of nestedKeys) {
    const nested = getObject(root[key]);
    if (!nested) continue;
    const nestedCandidates = [nested.luma_event_id, nested.event_id, nested.event_api_id, nested.api_id];
    for (const candidate of nestedCandidates) {
      const value = readString(candidate);
      if (value) return value;
    }
  }

  return null;
}

export const Route = createFileRoute("/hooks/luma-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookToken = process.env.LUMA_WEBHOOK_TOKEN;
        const apiKey = process.env.LUMA_API_KEY;
        const calendarId = process.env.LUMA_CALENDAR_API_ID;
        const authHeader = request.headers.get("authorization");
        const providedToken = authHeader?.replace("Bearer ", "") || request.headers.get("x-luma-webhook-token");

        if (!webhookToken || !providedToken || providedToken !== webhookToken) {
          return json({ error: "Unauthorized" }, 401);
        }
        if (!apiKey) {
          return json({ error: "LUMA_API_KEY não configurada nos secrets." }, 500);
        }
        if (!calendarId) {
          return json({ error: "LUMA_CALENDAR_API_ID não configurado nos secrets." }, 500);
        }

        try {
          const payload = await request.json();
          const eventType = extractEventType(payload);
          const lumaEventId = extractLumaEventId(payload);
          const auditId = await createLumaWebhookAudit({
            event_type: eventType,
            luma_event_id: lumaEventId,
            delivery_status: "received",
            sync_mode: "unknown",
            request_headers: normalizeHeaders(request.headers),
            payload,
          });

          if (lumaEventId) {
            try {
              const result = await syncLumaEventByExternalId({
                apiKey,
                calendarApiId: calendarId,
                lumaEventId,
              });
              await updateLumaWebhookAudit(auditId, {
                event_type: eventType,
                luma_event_id: lumaEventId,
                delivery_status: "processed",
                sync_mode: "event",
                result,
              });
              return json({ ok: true, mode: "event", luma_event_id: lumaEventId, event_type: eventType, result });
            } catch (eventErr) {
              console.error("Luma webhook event sync error:", eventErr);
              const fallback = await syncEntireCalendar({ apiKey, calendarApiId: calendarId });
              await updateLumaWebhookAudit(auditId, {
                event_type: eventType,
                luma_event_id: lumaEventId,
                delivery_status: "fallback_full_sync",
                sync_mode: "full",
                error_message: eventErr instanceof Error ? eventErr.message : "event sync failed",
                result: fallback,
              });
              return json({
                ok: true,
                mode: "full",
                fallback_from_event: lumaEventId,
                event_type: eventType,
                result: fallback,
              });
            }
          }

          try {
            const result = await syncEntireCalendar({ apiKey, calendarApiId: calendarId });
            await updateLumaWebhookAudit(auditId, {
              event_type: eventType,
              luma_event_id: lumaEventId,
              delivery_status: "processed",
              sync_mode: "full",
              result,
            });
            return json({ ok: true, mode: "full", event_type: eventType, result });
          } catch (fullErr) {
            await updateLumaWebhookAudit(auditId, {
              event_type: eventType,
              luma_event_id: lumaEventId,
              delivery_status: "failed",
              sync_mode: "full",
              error_message: fullErr instanceof Error ? fullErr.message : "full sync failed",
              result: {},
            });
            throw fullErr;
          }
        } catch (err) {
          console.error("Luma webhook error:", err);
          return json({ error: "Internal server error" }, 500);
        }
      },
    },
  },
});
