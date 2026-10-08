import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";

import {
  autonomyFromRisk,
  claimTask,
  heartbeatTask,
  isAgentReady,
  isStale,
  markStale,
  normalizePlaneTask,
  reclaimTask,
  releaseTask,
  riskFromTask,
  shouldIgnoreDuplicate,
  verifyPlaneSignature,
  type AgentTaskEnvelope,
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
      status: "READY",
      provider: "auto",
      claim: null,
    });
    expect(task.scope_out).toContain("main");
    expect(task.evidence_required).toContain("tests");
    expect(task.invariants.length).toBeGreaterThan(0);
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

  it("assigns conservative autonomy for P0", () => {
    expect(autonomyFromRisk("P0")).toBe("L1");
    expect(autonomyFromRisk("P1")).toBe("L2");
  });
});

describe("claim / lease / heartbeat", () => {
  function readyTask(): AgentTaskEnvelope {
    return normalizePlaneTask(event, "LW-20261007-002");
  }

  it("claims a READY task and sets lease + heartbeat", () => {
    const now = new Date("2026-10-07T14:00:00.000Z");
    const claimed = claimTask(readyTask(), "grok", {
      now,
      branch: "agent/orchestrator/LW-20261007-002-claim-lease-envelope",
    });

    expect(claimed.status).toBe("CLAIMED");
    expect(claimed.claim).not.toBeNull();
    expect(claimed.claim!.owner).toBe("grok");
    expect(claimed.claim!.lease_start).toBe(now.toISOString());
    expect(claimed.claim!.last_heartbeat).toBe(now.toISOString());
    expect(new Date(claimed.claim!.lease_expiry).getTime()).toBeGreaterThan(now.getTime());
    expect(claimed.claim!.branch).toContain("LW-20261007-002");
  });

  it("rejects double claim by a different owner while lease is live", () => {
    const now = new Date("2026-10-07T14:00:00.000Z");
    const claimed = claimTask(readyTask(), "grok", { now });

    expect(() => claimTask(claimed, "chatgpt", { now })).toThrow(/already claimed/);
  });

  it("records heartbeat and transitions CLAIMED → IN_PROGRESS", () => {
    const t0 = new Date("2026-10-07T14:00:00.000Z");
    const claimed = claimTask(readyTask(), "grok", { now: t0 });

    const t1 = new Date("2026-10-07T14:20:00.000Z");
    const hb = heartbeatTask(claimed, "grok", { now: t1 });

    expect(hb.status).toBe("IN_PROGRESS");
    expect(hb.claim!.last_heartbeat).toBe(t1.toISOString());
  });

  it("accepts heartbeat before expiry but rejects at and after expiry", () => {
    const t0 = new Date("2026-10-07T14:00:00.000Z");
    const claimed = claimTask(readyTask(), "grok", { now: t0, leaseMs: 1000 });

    expect(() =>
      heartbeatTask(claimed, "grok", { now: new Date(t0.getTime() + 999) }),
    ).not.toThrow();
    expect(() => heartbeatTask(claimed, "grok", { now: new Date(t0.getTime() + 1000) })).toThrow(
      /lease expired/,
    );
    expect(() => heartbeatTask(claimed, "grok", { now: new Date(t0.getTime() + 1001) })).toThrow(
      /lease expired/,
    );
  });

  it("rejects heartbeat from non-owner", () => {
    const claimed = claimTask(readyTask(), "grok");
    expect(() => heartbeatTask(claimed, "chatgpt")).toThrow(/claimed by grok/);
  });

  it("releases claim back to READY", () => {
    const claimed = claimTask(readyTask(), "grok");
    const released = releaseTask(claimed, "grok");

    expect(released.status).toBe("READY");
    expect(released.claim).toBeNull();
  });

  it("can release as BLOCKED", () => {
    const claimed = claimTask(readyTask(), "grok");
    const blocked = releaseTask(claimed, "grok", { blocked: true, reason: "waiting on human" });

    expect(blocked.status).toBe("BLOCKED");
    expect(blocked.claim).toBeNull();
  });

  it("detects stale when lease expired and heartbeat grace exceeded", () => {
    const t0 = new Date("2026-10-07T10:00:00.000Z");
    // Force a very short lease for the test
    const claimed = claimTask(readyTask(), "grok", {
      now: t0,
      leaseMs: 1000, // 1 second
    });

    // Still within grace window immediately after expiry
    const justAfter = new Date(t0.getTime() + 2000);
    expect(isStale(claimed, justAfter)).toBe(false);

    // Far past grace
    const farLater = new Date(t0.getTime() + 2 * 60 * 60 * 1000);
    expect(isStale(claimed, farLater)).toBe(true);

    const marked = markStale(claimed, farLater);
    expect(marked.status).toBe("STALE");
  });

  it("allows reclaim of a STALE task by a new owner", () => {
    const t0 = new Date("2026-10-07T10:00:00.000Z");
    const claimed = claimTask(readyTask(), "grok", {
      now: t0,
      leaseMs: 1000,
    });
    const farLater = new Date(t0.getTime() + 2 * 60 * 60 * 1000);
    const stale = markStale(claimed, farLater);

    const reclaimed = reclaimTask(stale, "chatgpt", { now: farLater });

    expect(reclaimed.status).toBe("CLAIMED");
    expect(reclaimed.claim!.owner).toBe("chatgpt");
    expect(reclaimed.claim!.lease_start).toBe(farLater.toISOString());
  });

  it("rejects release by the previous owner after stale reclaim", () => {
    const t0 = new Date("2026-10-07T10:00:00.000Z");
    const claimed = claimTask(readyTask(), "grok", { now: t0, leaseMs: 1000 });
    const farLater = new Date(t0.getTime() + 2 * 60 * 60 * 1000);
    const reclaimed = reclaimTask(markStale(claimed, farLater), "chatgpt", { now: farLater });

    expect(() => releaseTask(reclaimed, "grok")).toThrow(/claimed by chatgpt/);
    expect(releaseTask(reclaimed, "chatgpt").status).toBe("READY");
  });

  it("does not mutate the original envelope", () => {
    const original = readyTask();
    const claimed = claimTask(original, "grok");

    expect(original.claim).toBeNull();
    expect(original.status).toBe("READY");
    expect(claimed.claim).not.toBeNull();
  });
});
