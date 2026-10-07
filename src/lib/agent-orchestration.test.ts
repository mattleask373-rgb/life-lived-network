import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";

import {
  isAgentReady,
  normalizePlaneTask,
  riskFromTask,
  shouldIgnoreDuplicate,
  verifyPlaneSignature,
  type PlaneWebhookEnvelope,
} from "./agent-orchestration";

const event: PlaneWebhookEnvelope = {
  version: "v2",
  delivery_id: "delivery-1",
  event_id: "event-1",
  entity_id: "work-item-1",
  entity_type: "issue",
  event: "workitem.updated",
  webhook_id: "webhook-1",
  workspace_id: "workspace-1",
  data: {
    id: "work-item-1",
    name: "Implement capability discovery",
    description: "Implement deterministic capability discovery.",
    priority: "high",
    labels: [{ name: "agent-ready" }, { name: "agent-implementation" }],
    state: { name: "Ready", group: "unstarted" },
  },
  previous_attributes: {},
};

describe("agent orchestration core", () => {
  it("verifies Plane HMAC signatures against the raw body", () => {
    const body = JSON.stringify(event);
    const secret = "plane_wh_test";
    const signature = createHmac("sha256", secret).update(body).digest("hex");

    expect(verifyPlaneSignature(body, signature, secret)).toBe(true);
    expect(verifyPlaneSignature(body + " ", signature, secret)).toBe(false);
    expect(verifyPlaneSignature(body, signature, "wrong")).toBe(false);
  });

  it("only dispatches work items explicitly marked agent-ready", () => {
    expect(isAgentReady(event)).toBe(true);
    expect(
      isAgentReady({
        ...event,
        data: {
          ...event.data,
          labels: [{ name: "agent-implementation" }],
        },
      }),
    ).toBe(false);
  });

  it("normalizes a Plane event into the shared task contract", () => {
    const task = normalizePlaneTask(event, "LW-20261007-001");

    expect(task).toMatchObject({
      task_id: "LW-20261007-001",
      source: {
        system: "plane",
        workspace_id: "workspace-1",
        work_item_id: "work-item-1",
        event_id: "event-1",
      },
      objective: "Implement deterministic capability discovery.",
      lane: "IMPLEMENTATION",
      autonomy: "L2",
      risk: "P1",
      provider: "auto",
    });
    expect(task.scope_out).toContain("main");
  });

  it("maps unknown priority to the lowest risk", () => {
    expect(riskFromTask({ priority: "unexpected" })).toBe("P3");
  });

  it("treats repeated event ids as duplicates", () => {
    expect(shouldIgnoreDuplicate("event-1", new Set(["event-1"]))).toBe(true);
    expect(shouldIgnoreDuplicate("event-2", new Set(["event-1"]))).toBe(false);
  });

  it("requires an objective before dispatch", () => {
    expect(() =>
      normalizePlaneTask(
        { ...event, data: { labels: [{ name: "agent-ready" }] } },
        "LW-20261007-002",
      ),
    ).toThrow("must have an objective");
  });
});
