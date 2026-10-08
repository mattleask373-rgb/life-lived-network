export type OperationalAutonomy = "L0" | "L1" | "L2";
export type OperationalRisk = "P0" | "P1" | "P2" | "P3";
export type OperationalLane = "PRODUCT" | "ARCHITECTURE" | "IMPLEMENTATION" | "QA" | "SECURITY" | "REVIEW" | "ORCHESTRATOR";
export type OperationalCapability = "implementation" | "review" | "research" | "security_audit" | "qa" | "human_judgment";
export type OperationalTask = Readonly<{ task_id: string; autonomy: OperationalAutonomy; risk: OperationalRisk; lane: OperationalLane }>;
export type OperationalProvider = Readonly<{ id: string; capabilities: readonly OperationalCapability[]; maxAutonomy: OperationalAutonomy }>;
export type ProviderHealth = Readonly<{ status: "available" | "degraded" | "unavailable" | "unknown"; checkedAt: string; detail?: string; latencyMs?: number }>;
export type ProviderSelectionPolicy = Readonly<{ requireHumanFor: readonly OperationalRisk[]; excludeProviders: readonly string[] }>;

export type OperationsGateCode = "AUTHENTICATION_REQUIRED" | "SCOPE_MISMATCH" | "DURABLE_CONTROL_PLANE_UNPROVEN" | "HOSTED_SECURITY_PROOF_REQUIRED" | "PROVIDER_UNAVAILABLE" | "PROVIDER_NOT_ELIGIBLE" | "HUMAN_APPROVAL_REQUIRED" | "ACTIVE_ATTEMPT_EXISTS" | "CANCELLED_TASK" | "EXECUTION_RESULT_INVALID";
export type OperationsGateIssue = Readonly<{ code: OperationsGateCode; message: string }>;

function autonomyRank(value: OperationalAutonomy): number { return { L0: 0, L1: 1, L2: 2 }[value]; }
function capabilityForLane(lane: OperationalLane): OperationalCapability | null {
  return { PRODUCT: "research", ARCHITECTURE: "review", IMPLEMENTATION: "implementation", QA: "qa", SECURITY: "security_audit", REVIEW: "review", ORCHESTRATOR: null }[lane];
}
function providerEligible(provider: OperationalProvider, task: OperationalTask, policy: ProviderSelectionPolicy): boolean {
  if (policy.excludeProviders.includes(provider.id)) return false;
  const required = capabilityForLane(task.lane);
  if (required && !provider.capabilities.includes(required)) return false;
  if (policy.requireHumanFor.includes(task.risk) && provider.id !== "human") return false;
  return autonomyRank(task.autonomy) <= autonomyRank(provider.maxAutonomy);
}

export type OperationsReadinessInput = Readonly<{
  authenticatedActorId: string | null;
  workspaceId: string | null;
  projectId: string | null;
  task: OperationalTask;
  provider: OperationalProvider;
  providerHealth: ProviderHealth;
  providerPolicy: ProviderSelectionPolicy;
  durableControlPlaneProven: boolean;
  hostedSecurityProof: boolean;
  activeAttemptId: string | null;
  humanApprovalRequired: boolean;
  humanApprovalPresent: boolean;
  cancelled: boolean;
}>;

export function evaluateOperationsReadiness(input: OperationsReadinessInput): readonly OperationsGateIssue[] {
  const issues: OperationsGateIssue[] = [];
  if (!input.authenticatedActorId?.trim()) issues.push({ code: "AUTHENTICATION_REQUIRED", message: "authenticated actor is required" });
  if (!input.workspaceId?.trim() || !input.projectId?.trim()) issues.push({ code: "SCOPE_MISMATCH", message: "authoritative workspace and project scope are required" });
  if (!input.durableControlPlaneProven) issues.push({ code: "DURABLE_CONTROL_PLANE_UNPROVEN", message: "durable control-plane persistence is not yet proven" });
  if (!input.hostedSecurityProof) issues.push({ code: "HOSTED_SECURITY_PROOF_REQUIRED", message: "hosted RLS/security proof is required before execution" });
  if (input.cancelled) issues.push({ code: "CANCELLED_TASK", message: "cancelled work cannot be resurrected" });
  if (input.providerHealth.status !== "available") issues.push({ code: "PROVIDER_UNAVAILABLE", message: `provider health is ${input.providerHealth.status}` });
  if (!providerEligible(input.provider, input.task, input.providerPolicy)) issues.push({ code: "PROVIDER_NOT_ELIGIBLE", message: `provider ${input.provider.id} is not eligible for ${input.task.lane}/${input.task.risk}/${input.task.autonomy}` });
  if (input.humanApprovalRequired && !input.humanApprovalPresent) issues.push({ code: "HUMAN_APPROVAL_REQUIRED", message: "explicit human approval is required before execution" });
  if (input.activeAttemptId) issues.push({ code: "ACTIVE_ATTEMPT_EXISTS", message: "task already has an active execution attempt" });
  return issues;
}
export function isOperationsReady(input: OperationsReadinessInput): boolean { return evaluateOperationsReadiness(input).length === 0; }

export type ProviderResultStatus = "VERIFYING" | "BLOCKED" | "FAILED" | "PARTIAL";
export function validateProviderResultForOperations(result: Readonly<{ status: string }>): OperationsGateIssue[] {
  if ((["VERIFYING","BLOCKED","FAILED","PARTIAL"] as const).includes(result.status as ProviderResultStatus)) return [];
  return [{ code: "EXECUTION_RESULT_INVALID", message: `provider returned forbidden outcome status ${result.status}` }];
}