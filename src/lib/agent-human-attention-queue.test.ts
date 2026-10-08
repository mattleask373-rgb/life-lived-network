import { describe, expect, it } from "vitest";
import { buildAttentionQueue, gateWorkType, type AttentionSignal } from "./agent-human-attention-queue";

describe("phase-6 human attention queue", () => {
  it("orders security and production items ahead of evidence gaps", () => {
    const signals: AttentionSignal[] = [
      {
        type: "EVIDENCE_INSUFFICIENT",
        projectId: "p1",
        taskId: "t1",
        gaps: ["no tests"],
      },
      {
        type: "FENCE_REJECT",
        projectId: "p1",
        taskId: "t2",
        attemptId: "a1",
        code: "GENERATION_MISMATCH",
        reason: "stale gen",
      },
      {
        type: "PRODUCTION_BOUNDARY",
        projectId: "p1",
        workType: "production_deployment",
        summary: "Deploy requested",
      },
    ];
    const queue = buildAttentionQueue(signals);
    expect(queue[0].kind).toBe("SECURITY_REVIEW_REQUIRED");
    expect(queue[1].kind).toBe("PRODUCTION_ACTION_REQUIRED");
    expect(queue[2].kind).toBe("EVIDENCE_INSUFFICIENT");
  });

  it("gates production work for humans and allows offline-safe research", () => {
    expect(gateWorkType("production_deployment").action).toBe("QUEUE_FOR_HUMAN");
    expect(gateWorkType("research").action).toBe("CONTINUE_OFFLINE_SAFE");
    expect(gateWorkType("unknown_thing").action).toBe("UNKNOWN_HOLD");
  });

  it("marks generation-mismatch fence rejects as blocking security review", () => {
    const queue = buildAttentionQueue([
      {
        type: "FENCE_REJECT",
        projectId: "p1",
        taskId: "t1",
        attemptId: "a1",
        code: "GENERATION_MISMATCH",
        reason: "stale",
      },
    ]);
    expect(queue[0].blocking).toBe(true);
    expect(queue[0].kind).toBe("SECURITY_REVIEW_REQUIRED");
  });
});
