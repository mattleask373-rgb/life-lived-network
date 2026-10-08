import { describe, expect, it } from "vitest";
import { evaluateOperationsReadiness, isOperationsReady, validateProviderResultForOperations, type OperationalProvider } from "./agent-operations-gate";

const provider: OperationalProvider = { id: "grok", capabilities: ["implementation","research","review","qa","security_audit"], maxAutonomy: "L2" };
const base = {
  authenticatedActorId: "actor-1", workspaceId: "workspace-1", projectId: "project-1",
  task: { task_id: "task-1", autonomy: "L2" as const, risk: "P3" as const, lane: "IMPLEMENTATION" as const },
  provider, providerHealth: { status: "available" as const, checkedAt: "2026-10-08T17:00:00Z" },
  providerPolicy: { requireHumanFor: ["P0","P1"] as const, excludeProviders: [] as const },
  durableControlPlaneProven: true, hostedSecurityProof: true, activeAttemptId: null,
  humanApprovalRequired: false, humanApprovalPresent: false, cancelled: false,
};

describe("operations readiness gate", () => {
  it("opens only when every prerequisite is proven", () => expect(isOperationsReady(base)).toBe(true));
  it("fails closed without authenticated identity", () => expect(evaluateOperationsReadiness({ ...base, authenticatedActorId: null })).toContainEqual(expect.objectContaining({ code: "AUTHENTICATION_REQUIRED" })));
  it("fails closed without durable proof", () => expect(evaluateOperationsReadiness({ ...base, durableControlPlaneProven: false })).toContainEqual(expect.objectContaining({ code: "DURABLE_CONTROL_PLANE_UNPROVEN" })));
  it("fails closed without hosted security proof", () => expect(evaluateOperationsReadiness({ ...base, hostedSecurityProof: false })).toContainEqual(expect.objectContaining({ code: "HOSTED_SECURITY_PROOF_REQUIRED" })));
  it("rejects an unhealthy provider", () => expect(evaluateOperationsReadiness({ ...base, providerHealth: { status: "degraded", checkedAt: "2026-10-08T17:00:00Z" } })).toContainEqual(expect.objectContaining({ code: "PROVIDER_UNAVAILABLE" })));
  it("requires human approval when policy demands it", () => expect(evaluateOperationsReadiness({ ...base, humanApprovalRequired: true })).toContainEqual(expect.objectContaining({ code: "HUMAN_APPROVAL_REQUIRED" })));
  it("blocks duplicate active execution", () => expect(evaluateOperationsReadiness({ ...base, activeAttemptId: "attempt-1" })).toContainEqual(expect.objectContaining({ code: "ACTIVE_ATTEMPT_EXISTS" })));
  it("cannot resurrect cancelled work", () => expect(evaluateOperationsReadiness({ ...base, cancelled: true })).toContainEqual(expect.objectContaining({ code: "CANCELLED_TASK" })));
  it("rejects provider capability mismatch", () => expect(evaluateOperationsReadiness({ ...base, task: { ...base.task, lane: "SECURITY" as const } })).toContainEqual(expect.objectContaining({ code: "PROVIDER_NOT_ELIGIBLE" })));
  it("accepts only non-terminal provider outcomes", () => { expect(validateProviderResultForOperations({ status: "VERIFYING" })).toEqual([]); expect(validateProviderResultForOperations({ status: "DONE" })).toContainEqual(expect.objectContaining({ code: "EXECUTION_RESULT_INVALID" })); });
});