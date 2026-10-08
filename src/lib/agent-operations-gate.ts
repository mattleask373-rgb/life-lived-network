import type { AgentExecutionResult } from "./agent-execution-contract";
import type { AgentTaskEnvelope } from "./agent-orchestration";
import type { ProviderDescriptor, ProviderHealth, ProviderSelectionPolicy } from "./agent-provider";
import { isEligibleProvider } from "./agent-provider";

export type OperationsGateCode =
  | "AUTHENTICATION_REQUIRED"
  | "SCOPE_MISMATCH"
  | "DURABLE_CONTROL_PLANE_UNPROVEN"
  | "HOSTED_SECURITY_PROOF_REQUIRED"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_NOT_ELIGIBLE"
  | "HUMAN_APPROVAL_REQUIRED"
  | "ACTIVE_ATTEMPT_EXISTS"
  | "CANCELLED_TASK"
  | "EXECUTION_RESULT_INVALID";

export type OperationsGateIssue = Readonly<{ code: OperationsGateCode; message: string }>;

export type OperationsReadinessInput = Readonly<{
  authenticatedActorId: string | null;
  workspaceId: string | null;
  projectId: string | null;
  task: Pick<AgentTaskEnvelope, "task_id" | "autonomy" | "risk" | "lane">;
  provider: ProviderDescriptor;
  providerHealth: ProviderHealth;
  providerPolicy: ProviderSelectionPolicy;
  durableControlPlaneProven: boolean;
  hostedSecurityProof: boolean;
  activeAttemptId: string | null;
  humanApprovalRequired: boolean;
  humanApprovalPresent: boolean;
}>;

export function evaluateOperationsReadiness(input: OperationsReadinessInput): readonly OperationsGateIssue[] {
  const issues: OperationsGateIssue[] = [];
  if (!input.authenticatedActorId?.trim()) issues.push({ code: "AUTHENTICATION_REQUIRED", message: "authenticated actor is required" });
  if (!input.workspaceId?.trim() || !input.projectId?.trim()) issues.push({ code: "SCOPE_MISMATCH", message: "authoritative workspace and project scope are required" });
  if (!input.durableControlPlaneProven) issues.push({ code: "DURABLE_CONTROL_PLANE_UNPROVEN", message: "durable control-plane persistence is not yet proven" });
  if (!input.hostedSecurityProof) issues.push({ code: "HOSTED_SECURITY_PROOF_REQUIRED", message: "hosted RLS/security proof is required before execution" });
  if (input.providerHealth.status !== "available") issues.push({ code: "PROVIDER_UNAVAILABLE", message: `provider health is ${input.providerHealth.status}` });
  const eligible = isEligibleProvider(input.provider, input.task, input.providerPolicy);
  if (!eligible.eligible) issues.push({ code: "PROVIDER_NOT_ELIGIBLE", message: eligible.reason });
  if (input.humanApprovalRequired && !input.humanApprovalPresent) issues.push({ code: "HUMAN_APPROVAL_REQUIRED", message: "explicit human approval is required before execution" });
  if (input.activeAttemptId) issues.push({ code: "ACTIVE_ATTEMPT_EXISTS", message: "task already has an active execution attempt" });
  return issues;
}

export function isOperationsReady(input: OperationsReadinessInput): boolean {
  return evaluateOperationsReadiness(input).length === 0;
}

export function validateProviderResultForOperations(result: AgentExecutionResult): OperationsGateIssue[] {
  if (result.status === "VERIFYING" || result.status === "BLOCKED" || result.status === "FAILED" || result.status === "PARTIAL") return [];
  return [{ code: "EXECUTION_RESULT_INVALID", message: `provider returned forbidden outcome status ${result.status}` }];
}