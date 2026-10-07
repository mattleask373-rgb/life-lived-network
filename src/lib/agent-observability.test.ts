import { describe, expect, it } from "vitest";

import { summariseTasks, type TaskObservationRow } from "./agent-observability";

describe("control-plane observability", () => {
  it("counts READY, CLAIMED family, STALE, BLOCKED, review, accepted", () => {
    const now = new Date("2026-10-07T15:00:00.000Z");
    const rows: TaskObservationRow[] = [
      {
        taskId: "a",
        status: "READY",
        owner: null,
        leaseExpiry: null,
        lastHeartbeat: null,
      },
      {
        taskId: "b",
        status: "IN_PROGRESS",
        owner: "grok",
        leaseExpiry: new Date("2026-10-07T18:00:00.000Z"),
        lastHeartbeat: new Date("2026-10-07T14:30:00.000Z"),
      },
      {
        taskId: "c",
        status: "STALE",
        owner: "plane_ai",
        leaseExpiry: null,
        lastHeartbeat: null,
      },
      {
        taskId: "d",
        status: "BLOCKED",
        owner: "grok",
        leaseExpiry: null,
        lastHeartbeat: null,
      },
      {
        taskId: "e",
        status: "REVIEW",
        owner: "grok",
        leaseExpiry: null,
        lastHeartbeat: null,
      },
      {
        taskId: "f",
        status: "ACCEPTED",
        owner: "grok",
        leaseExpiry: null,
        lastHeartbeat: null,
      },
    ];

    const snap = summariseTasks(rows, now);
    expect(snap.total).toBe(6);
    expect(snap.ready).toBe(1);
    expect(snap.claimed).toBe(1);
    expect(snap.stale).toBe(1);
    expect(snap.blocked).toBe(1);
    expect(snap.inReview).toBe(1);
    expect(snap.acceptedAwaitingHuman).toBe(1);
    expect(snap.activeWithValidLease).toBe(1);
    expect(snap.owners.grok).toBe(4);
  });
});
