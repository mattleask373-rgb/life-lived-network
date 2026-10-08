import { describe, expect, it } from "vitest";
import { evaluateOperationsReadiness, isOperationsReady, validateProviderResultForOperations } from "./agent-operations-gate";
import { EXAMPLE_PROVIDER_DESCRIPTORS } from "./agent-provider";

const base = {
  authenticatedActorId: "actor-1",
  workspaceId: "workspace-1",
  projectId: "project-1",
  task: { task_id: "task-1", autonomy: "L2", risk: "P3", lane: "IMPLEMENTATION" as const },
  provider: EXAMPLE_PROVIDER_DESCRIPTORS[0],
  providerHealth: { status: "available" as const, checkedAt: "2026-10-08T17:00:00Z" },
  providerPolicy: { preferIndependentReviewer: true, requireHumanFor: ["P0","P1"] as const, excludeProviders: [] as string[] },
  durableControlPlaneProven: true,
  hostedSecurityProof: true,
  activeAttemptId: null,
  humanApprovalRequired: false,
  humanApprovalPresent: false,
};

describe("operations readiness gate", () => {
  it("opens only when every prerequisite is proven", () => expect(isOperationsReady(base)).toBe(true));
  it("fails closed without authenticated identity", () => {
    expect(evaluateOperationsReadiness({ ...base, authenticatedActorId: null })).toContainEqual(expect.objectContaining({ code: "AUTHENTICATION_REQUIRED" }));
  });
  it("fails closed without durable proof", () => {
    expect(evaluateOperationsReadiness({ ...base, durableControlPlaneProven: false })).toContainEqual(expect.objectContaining({ code: "DURABLE_CONTROL_PLANE_UNPROVEN" }));
  });
  it("fails closed without hosted security proof", () => {
    expect(evaluateOperationsReadiness({ ...base, hostedSecurityProof: false })).toContainEqual(expect.objectContaining({ code: "HOSTED_SECURITY_PROOF_REQUIRED" }));
  });
  it("rejects an unhealthy provider", () => {
    expect(evaluateOperationsReadiness({ ...base, providerHealth: { status: "degraded", checkedAt: "2026-10-08T17:00:00Z" } })).toContainEqual(expect.objectContaining({ code: "PROVIDER_UNAVAILABLE" }));
  });
  it("requires human approval when policy demands it", () => {
    expect(evaluateOperationsReadiness({ ...base, humanApprovalRequired: true })).toContainEqual(expect.objectContaining({ code: "HUMAN_APPROVAL_REQUIRED" }));
  });
  it("blocks duplicate active execution", () => {
    expect(evaluateOperationsReadiness({ ...base, activeAttemptId: "attempt-1" })).toContainEqual(expect.objectContaining({ code: "ACTIVE_ATTEMPT_EXISTS" }));
  });
  it("rejects provider self-certifying terminal success", () => {
    expect(validateProviderResultForOperations({
      taskId: "task-1", status: "VERIFYING", summary: "ok", changedPaths: ["x"], testsRun: [], testsPassed: 0, testsFailed: 0,
      claims: [], uncertainties: [], blockers: [], handoff: "handoff evidence", recommendedNextAction: "verify", provider: { id: "grok" },
    })).toEqual([]);
    expect(validateProviderResultForOperations({
      taskId: "task-1", status: "DONE" as never, summary: "done", changedPaths: ["x"], testsRun: [], testsPassed: 0, testsFailed: 0,
      claims: [], uncertainties: [], blockers: [], handoff: "handoff evidence", recommendedNextAction: "verify", provider: { id: "grok" },
    })[0]?.code).toBe("EXECUTION_RESULT_INVALID");
  });
});