import { resolveAuthoritativeAgentScope, type ControlPlaneScope } from "./agent-scope-resolution";
import { evaluateOperationsReadiness, type OperationalProvider, type OperationalTask, type ProviderHealth, type ProviderSelectionPolicy } from "./agent-operations-gate";

export type SupervisorCycleDecision = Readonly<{ kind: "DISPATCH_READY" | "HOLD"; taskId: string; providerId: string; reason: string }>;
export type SupervisorCycleAdapters = Readonly<{
  lookupScope: (actorId: string) => Promise<Readonly<{ workspaceId: string; projectId: string }> | null>;
  checkDurableControlPlane: () => Promise<Readonly<{ status: "PROVEN" | "UNPROVEN" | "UNKNOWN"; evidenceRef?: string; checkedAt: string }>>;
  checkHostedSecurity: () => Promise<Readonly<{ status: "PROVEN" | "UNPROVEN" | "UNKNOWN"; evidenceRef?: string; checkedAt: string }>>;
  readProviderHealth: (providerId: string) => Promise<ProviderHealth>;
  hasActiveAttempt: (taskId: string) => Promise<string | null>;
  requestDispatch: (scope: ControlPlaneScope, task: OperationalTask, provider: OperationalProvider) => Promise<void>;
}>;

export async function runBoundedSupervisorCycle(input: Readonly<{ actorId: string | null; task: OperationalTask; provider: OperationalProvider; providerPolicy: ProviderSelectionPolicy; adapters: SupervisorCycleAdapters }>): Promise<SupervisorCycleDecision> {
  let scope: ControlPlaneScope;
  try { scope = await resolveAuthoritativeAgentScope(input.actorId, input.adapters.lookupScope); }
  catch (error: unknown) { return { kind: "HOLD", taskId: input.task.task_id, providerId: input.provider.id, reason: error instanceof Error ? error.message : "UNKNOWN: authoritative scope resolution failed" }; }
  const [durableProof, hostedProof] = await Promise.all([
    input.adapters.checkDurableControlPlane(),
    input.adapters.checkHostedSecurity(),
  ]);
  const durable = durableProof.status === "PROVEN" && Boolean(durableProof.evidenceRef?.trim());
  const hosted = hostedProof.status === "PROVEN" && Boolean(hostedProof.evidenceRef?.trim());
  const health = await input.adapters.readProviderHealth(input.provider.id);
  const activeAttemptId = await input.adapters.hasActiveAttempt(input.task.task_id);
  const issues = evaluateOperationsReadiness({ authenticatedActorId: scope.actorId, workspaceId: scope.workspaceId, projectId: scope.projectId, task: input.task, provider: input.provider, providerHealth: health, providerPolicy: input.providerPolicy, durableControlPlaneProven: durable, hostedSecurityProof: hosted, activeAttemptId, humanApprovalRequired: false, humanApprovalPresent: false, cancelled: false });
  if (issues.length > 0) return { kind: "HOLD", taskId: input.task.task_id, providerId: input.provider.id, reason: issues.map((x) => x.code + ": " + x.message).join("; ") };
  if (!durable || !hosted) return { kind: "HOLD", taskId: input.task.task_id, providerId: input.provider.id, reason: "DURABLE_CONTROL_PLANE_UNPROVEN or HOSTED_SECURITY_PROOF_REQUIRED: proof must include a trusted evidence reference" };
  await input.adapters.requestDispatch(scope, input.task, input.provider);
  return { kind: "DISPATCH_READY", taskId: input.task.task_id, providerId: input.provider.id, reason: "all bounded operations prerequisites passed" };
}