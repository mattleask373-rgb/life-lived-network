import { createFileRoute } from "@tanstack/react-router";

import {
  isAgentReady,
  normalizePlaneTask,
  verifyPlaneSignature,
  type PlaneWebhookEnvelope,
} from "@/lib/agent-orchestration";

const JSON_HEADERS = { "content-type": "application/json" };

function taskIdFor(event: PlaneWebhookEnvelope): string {
  const compact = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return \`LW-${compact}-${event.entity_id.slice(0, 8).toUpperCase()}\`;
}

export const Route = createFileRoute("/api/agents/plane-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature =
          request.headers.get("x-plane-signature") ??
          request.headers.get("x-plane-webhook-signature");
        const secret = process.env["PLANE_WEBHOOK_SECRET"];

        if (!secret || !verifyPlaneSignature(rawBody, signature, secret)) {
          return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
            status: 401, headers: JSON_HEADERS,
          });
        }

        let event: PlaneWebhookEnvelope;
        try {
          event = JSON.parse(rawBody) as PlaneWebhookEnvelope;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
            status: 400, headers: JSON_HEADERS,
          });
        }

        if (!event.event_id || !event.entity_id || !event.workspace_id) {
          return new Response(JSON.stringify({ error: "Incomplete webhook envelope" }), {
            status: 400, headers: JSON_HEADERS,
          });
        }

        const {
          hasAgentEvent, markAgentEvent, recordAgentEvent, recordNormalizedAgentTask,
        } = await import("@/lib/agent-event-store.server");

        if (await hasAgentEvent(event.event_id)) {
          return new Response(JSON.stringify({ accepted: true, duplicate: true }), {
            headers: JSON_HEADERS,
          });
        }

        await recordAgentEvent({
          eventId: event.event_id, deliveryId: event.delivery_id, webhookId: event.webhook_id,
          eventType: event.event, entityId: event.entity_id, workspaceId: event.workspace_id,
          payload: event,
        });

        if (!isAgentReady(event)) {
          await markAgentEvent(event.event_id, "ignored");
          return new Response(JSON.stringify({ accepted: true, dispatched: false }), {
            headers: JSON_HEADERS,
          });
        }

        try {
          const task = normalizePlaneTask(event, taskIdFor(event));
          await recordNormalizedAgentTask(task, event.event_id);
          await markAgentEvent(event.event_id, "normalized");
          return new Response(JSON.stringify({ accepted: true, dispatched: true, task }), {
            headers: JSON_HEADERS,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Normalization failed";
          await markAgentEvent(event.event_id, "failed", message);
          return new Response(JSON.stringify({ error: message }), {
            status: 422, headers: JSON_HEADERS,
          });
        }
      },
    },
  },
});
