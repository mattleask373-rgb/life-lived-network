import { describe, expect, it } from "vitest";
import { decideReclaimAbandon } from "./agent-reclaim-abandon";

describe("reclaim attempt abandonment", () => {
  it("abandons active attempts from previous generation", () => {
    const decisions = decideReclaimAbandon(4, [
      {
        attemptId: "a-old",
        taskId: "t1",
        leaseGeneration: 3,
        status: "RUNNING",
      },
    ]);
    expect(decisions).toEqual([
      {
        kind: "ABANDON",
        attemptId: "a-old",
        reason: "stale generation 3 after reclaim to 4",
      },
    ]);
  });

  it("does not rewrite terminal FAILED/SUCCEEDED history", () => {
    const decisions = decideReclaimAbandon(4, [
      { attemptId: "a1", taskId: "t1", leaseGeneration: 2, status: "FAILED" },
      { attemptId: "a2", taskId: "t1", leaseGeneration: 2, status: "SUCCEEDED" },
    ]);
    expect(decisions.every((d) => d.kind === "HOLD")).toBe(true);
  });

  it("holds already-abandoned and current-generation attempts", () => {
    const decisions = decideReclaimAbandon(4, [
      { attemptId: "a3", taskId: "t1", leaseGeneration: 3, status: "ABANDONED" },
      { attemptId: "a4", taskId: "t1", leaseGeneration: 4, status: "DISPATCHED" },
    ]);
    expect(decisions.every((d) => d.kind === "HOLD")).toBe(true);
  });
});
