/**
 * Provider-neutral, single-task worker runtime.
 *
 * This is the execution core only. A trusted server/worker adapter must load
 * the canonical task, resolve actor scope, call the durable control-plane RPCs,
 * and persist fenced evidence. It is intentionally not wired to secrets,
 * Supabase, a scheduler, or a model provider by this module.
 *
 * Safety invariants:
 * - disabled by default at the call site;
 * - disposable/development environment only;
 * - authenticated identity and workspace/project scope are server-derived;
 * - one READY task and one bounded provider call per cycle;
 * - every heartbeat/result/failure write carries the same fencing lease;
 * - model output can never accept, integrate, merge, or deploy work.
 */

export type WorkerEnvironmentKind =
  "DISPOSABLE" | "DEVELOPMENT" | "STAGING" | "PRODUCTION" | "UNKNOWN";

export type WorkerProofStatus = "PROVEN" | "UNPROVEN" | "UNKNOWN";
export type WorkerAutonomy = "L0" | "L1" | "L2" | "L3" | "L4";
export type WorkerRisk = "P0" | "P1" | "P2" | "P3";
export type WorkerLane =
  "PRODUCT" | "ARCHITECTURE" | "IMPLEMENTATION" | "QA" | "SECURITY" | "REVIEW" | "ORCHESTRATOR";

export type WorkerCapability = "implementation" | "research" | "review" | "qa" | "security_audit";

export type WorkerProviderHealthStatus = "available" | "degraded" | "unavailable" | "unknown";

export interface WorkerProof {
  status: WorkerProofStatus;
  evidenceRef?: string;
  checkedAt: string;
}

export interface WorkerEnvironmentAttestation extends WorkerProof {
  kind: WorkerEnvironmentKind;
}

export type WorkerActorSource =
  "WORKLOAD_IDENTITY" | "SERVER_SESSION" | "ENVIRONMENT" | "UNTRUSTED" | "UNKNOWN";

export interface WorkerActorIdentity {
  actorId: string | null;
  source: WorkerActorSource;
}

export interface WorkerTask {
  taskId: string;
  objective: string;
  workspaceId: string;
  projectId: string;
  status: "READY" | "CLAIMED" | "IN_PROGRESS" | "VERIFYING" | "BLOCKED" | "CANCELLED";
  autonomy: WorkerAutonomy;
  risk: WorkerRisk;
  lane: WorkerLane;
  scopeIn: readonly string[];
  scopeOut: readonly string[];
  acceptanceCriteria: readonly string[];
  humanApprovalRequired: boolean;
  cancelled: boolean;
}

export interface WorkerProvider {
  id: string;
  capabilities: readonly WorkerCapability[];
  maxAutonomy: WorkerAutonomy;
  maxRiskWithoutHumanGate: WorkerRisk;
  execute(task: WorkerTask, context: WorkerProviderContext, signal: AbortSignal): Promise<unknown>;
}

export interface WorkerProviderHealth {
  status: WorkerProviderHealthStatus;
  checkedAt: string;
  // Never forward detail to user-visible status: provider diagnostics can carry secrets.
  detail?: string;
}

export interface WorkerScope {
  actorId: string;
  workspaceId: string;
  projectId: string;
}

export interface WorkerDispatchRequest {
  // Reuse this UUID as the durable execution run ID for retry-safe run creation.
  cycleId: string;
  correlationId: string;
  actorId: string;
  workspaceId: string;
  projectId: string;
  taskId: string;
  providerId: string;
  autonomy: WorkerAutonomy;
  risk: WorkerRisk;
}

export interface WorkerLease {
  taskId: string;
  attemptId: string;
  runId: string;
  correlationId: string;
  actorId: string;
  workspaceId: string;
  projectId: string;
  /** Must be the status returned by the atomic dispatch RPC, not inferred locally. */
  status: string;
  leaseGeneration: number;
  leaseToken: string;
  leaseExpiresAt: string;
}

export type WorkerProviderReportedTests = "PASS" | "FAIL" | "NOT_RUN";
export type WorkerProviderResultStatus = "VERIFYING" | "BLOCKED" | "FAILED" | "PARTIAL";

export interface WorkerProviderResult {
  status: WorkerProviderResultStatus;
  summary: string;
  evidenceRefs: string[];
  changedPaths: string[];
  providerReportedTests: WorkerProviderReportedTests;
  uncertainties: string[];
  nextAction: string;
}

export type WorkerFailureCode = "EXECUTION_TIMEOUT" | "PROVIDER_FAILED" | "PROVIDER_RESULT_INVALID";

export interface WorkerFailure {
  code: WorkerFailureCode;
  message: string;
}

export interface WorkerRuntimeAdapters {
  /** Must read the canonical task from the durable store, not from caller payload. */
  loadTask(taskId: string): Promise<WorkerTask | null>;
  /** Must use authenticated server identity plus real application membership; no infra-ID fallback. */
  resolveAuthoritativeScope(
    actorId: string,
  ): Promise<Readonly<{ workspaceId: string; projectId: string }> | null>;
  readDurableControlPlaneProof(): Promise<WorkerProof>;
  readHostedSecurityProof(): Promise<WorkerProof>;
  readProviderHealth(providerId: string): Promise<WorkerProviderHealth>;
  findActiveAttempt(taskId: string): Promise<string | null>;
  /**
   * Server-only adapter for the existing run ledger + dispatch_agent_attempt RPC.
   * It must atomically claim the READY task and return its lease; it must not
   * implement a second local task/lease engine or accept client-supplied scope.
   */
  dispatchAtomically(request: WorkerDispatchRequest): Promise<WorkerLease>;
  /** Calls the fenced heartbeat RPC using the private lease token/generation. */
  heartbeatFenced(lease: WorkerLease): Promise<boolean>;
  /**
   * Persist sanitized evidence and a non-terminal status in one fenced operation.
   * It must reject stale generation/token and must never mark work ACCEPTED/INTEGRATED.
   */
  recordResultFenced(lease: WorkerLease, result: WorkerProviderResult): Promise<boolean>;
  /** Persist only a safe failure code/message under the same lease fence. */
  recordFailureFenced(lease: WorkerLease, failure: WorkerFailure): Promise<boolean>;
}

export type WorkerGateCode =
  | "WORKER_DISABLED"
  | "INVALID_CYCLE_ID"
  | "INVALID_RUNTIME_BOUNDS"
  | "ENVIRONMENT_NOT_ALLOWED"
  | "ENVIRONMENT_NOT_PROVEN"
  | "AUTHENTICATION_REQUIRED"
  | "TASK_NOT_FOUND"
  | "TASK_READ_FAILED"
  | "TASK_NOT_READY"
  | "TASK_CANCELLED"
  | "TASK_SCOPE_INCOMPLETE"
  | "HUMAN_APPROVAL_REQUIRED"
  | "RISK_REQUIRES_HUMAN"
  | "AUTONOMY_NOT_SUPPORTED"
  | "SCOPE_AUTHORITY_MISSING"
  | "SCOPE_MISMATCH"
  | "CONTROL_PLANE_UNPROVEN"
  | "HOSTED_SECURITY_UNPROVEN"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_NOT_ELIGIBLE"
  | "ACTIVE_ATTEMPT_EXISTS"
  | "READINESS_EVIDENCE_UNAVAILABLE"
  | "DISPATCH_REJECTED"
  | "INVALID_LEASE"
  | "LEASE_LOST"
  | "EXECUTION_TIMEOUT"
  | "PROVIDER_FAILED"
  | "PROVIDER_RESULT_INVALID"
  | "PERSISTENCE_UNCONFIRMED";

export type WorkerCycleOutcome =
  | "DISABLED"
  | "HELD"
  | "DISPATCH_REJECTED"
  | "LEASE_LOST"
  | "TIMED_OUT"
  | "PROVIDER_FAILED"
  | "INVALID_PROVIDER_RESULT"
  | "PERSISTENCE_UNCONFIRMED"
  | "REVIEW_REQUIRED"
  | "BLOCKED"
  | "PARTIAL"
  | "FAILED";

export interface WorkerCycleResult {
  outcome: WorkerCycleOutcome;
  taskId: string;
  attemptId?: string;
  code?: WorkerGateCode;
  reason: string;
  providerResult?: WorkerProviderResult;
}

export interface WorkerCycleInput {
  /** Must be set only by an explicit operator-controlled feature flag. */
  enabled: boolean;
  /** Stable UUID for this scheduler invocation; reused for retry-safe run creation. */
  cycleId: string;
  actor: WorkerActorIdentity;
  environment: WorkerEnvironmentAttestation;
  taskId: string;
  provider: WorkerProvider;
  excludedProviderIds: readonly string[];
  timeoutMs: number;
  heartbeatIntervalMs: number;
  adapters: WorkerRuntimeAdapters;
}

export const WORKER_MAX_AUTONOMY: WorkerAutonomy = "L2";
export const WORKER_MAX_TIMEOUT_MS = 5 * 60 * 1000;
export const WORKER_MAX_HEARTBEAT_INTERVAL_MS = 60 * 1000;
export const WORKER_MAX_PROOF_AGE_MS = 5 * 60 * 1000;
export const WORKER_MAX_PROVIDER_HEALTH_AGE_MS = 2 * 60 * 1000;

const MAX_CLOCK_SKEW_MS = 60 * 1000;
const MIN_TIMEOUT_MS = 1000;
const MIN_HEARTBEAT_INTERVAL_MS = 100;
const HUMAN_GATED_RISKS: readonly WorkerRisk[] = ["P0", "P1"];
const ALLOWED_ENVIRONMENTS: readonly WorkerEnvironmentKind[] = ["DISPOSABLE", "DEVELOPMENT"];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SENSITIVE_VALUE_PATTERN =
  /(?:sk-[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|Bearer\s+\S+|-----BEGIN (?:OPENSSH|RSA|EC|PRIVATE) KEY-----|(?:token|secret|password|api[_-]?key)\s*[:=]\s*\S+)/i;

const AUTONOMY_RANK: Record<WorkerAutonomy, number> = {
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
};

const RISK_RANK: Record<WorkerRisk, number> = {
  P3: 0,
  P2: 1,
  P1: 2,
  P0: 3,
};

function held(taskId: string, code: WorkerGateCode, reason: string): WorkerCycleResult {
  return { outcome: "HELD", taskId, code, reason };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonBlank(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function proofIsFresh(proof: WorkerProof, nowMs: number, maxAgeMs: number): boolean {
  if (proof.status !== "PROVEN" || !nonBlank(proof.evidenceRef)) return false;
  if (SENSITIVE_VALUE_PATTERN.test(proof.evidenceRef)) return false;
  if (!proof.evidenceRef.startsWith("https://") && !proof.evidenceRef.startsWith("urn:")) {
    return false;
  }
  const checkedAtMs = Date.parse(proof.checkedAt);
  if (!Number.isFinite(checkedAtMs)) return false;
  return checkedAtMs <= nowMs + MAX_CLOCK_SKEW_MS && nowMs - checkedAtMs <= maxAgeMs;
}

function capabilityForLane(lane: WorkerLane): WorkerCapability | null {
  const mapping: Record<WorkerLane, WorkerCapability | null> = {
    PRODUCT: "research",
    ARCHITECTURE: "review",
    IMPLEMENTATION: "implementation",
    QA: "qa",
    SECURITY: "security_audit",
    REVIEW: "review",
    ORCHESTRATOR: null,
  };
  return mapping[lane];
}

function normalizeScope(value: string): string {
  return value
    .trim()
    .replace(/\/\*\*$/, "")
    .replace(/\/+$/, "");
}

function pathWithinScope(path: string, scope: string): boolean {
  const prefix = normalizeScope(scope);
  if (!prefix || prefix === "main") return false;
  return path === prefix || path.startsWith(prefix + "/");
}

function isSafeRepositoryPath(value: unknown): value is string {
  if (!nonBlank(value) || value.length > 300) return false;
  const path = value.trim();
  if (path.startsWith("/") || path.includes("\\") || path.includes("\0")) return false;
  const segments = path.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return false;
  if (path === ".env" || (path.startsWith(".env.") && path !== ".env.example")) return false;
  if (/(^|\/)(\.git|secrets?)(\/|$)/i.test(path)) return false;
  if (/\.(pem|p12|pfx|key)$/i.test(path)) return false;
  return !SENSITIVE_VALUE_PATTERN.test(path);
}

function hasDisallowedControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (
      code === 0 ||
      (code >= 1 && code <= 8) ||
      code === 11 ||
      code === 12 ||
      (code >= 14 && code <= 31)
    ) {
      return true;
    }
  }
  return false;
}

function safeText(value: unknown, maxLength: number): string | null {
  if (!nonBlank(value) || value.length > maxLength) return null;
  const text = value.trim();
  if (hasDisallowedControlCharacter(text)) return null;
  if (SENSITIVE_VALUE_PATTERN.test(text)) return null;
  return text;
}

/** Parse only a bounded, structured provider report; raw model output is never persisted. */
export function validateWorkerProviderResult(
  value: unknown,
  task: WorkerTask,
): WorkerProviderResult | null {
  if (!isRecord(value)) return null;

  const allowedStatuses: readonly WorkerProviderResultStatus[] = [
    "VERIFYING",
    "BLOCKED",
    "FAILED",
    "PARTIAL",
  ];
  if (
    typeof value.status !== "string" ||
    !allowedStatuses.includes(value.status as WorkerProviderResultStatus)
  ) {
    // DONE / ACCEPTED / INTEGRATED and every unknown status are intentionally forbidden.
    return null;
  }

  const summary = safeText(value.summary, 2000);
  const nextAction = safeText(value.nextAction, 500);
  const tests = value.providerReportedTests;
  if (!summary || !nextAction || !["PASS", "FAIL", "NOT_RUN"].includes(String(tests))) return null;

  if (!Array.isArray(value.evidenceRefs) || value.evidenceRefs.length > 30) return null;
  const evidenceRefs: string[] = [];
  for (const item of value.evidenceRefs) {
    const ref = safeText(item, 1000);
    if (
      !ref ||
      (!ref.startsWith("https://") && !ref.startsWith("urn:")) ||
      evidenceRefs.includes(ref)
    ) {
      return null;
    }
    evidenceRefs.push(ref);
  }

  if (!Array.isArray(value.changedPaths) || value.changedPaths.length > 50) return null;
  const changedPaths: string[] = [];
  for (const item of value.changedPaths) {
    if (
      !isSafeRepositoryPath(item) ||
      !task.scopeIn.some((scope) => pathWithinScope(item, scope)) ||
      task.scopeOut.some((scope) => pathWithinScope(item, scope))
    ) {
      return null;
    }
    if (!changedPaths.includes(item)) changedPaths.push(item);
  }

  if (!Array.isArray(value.uncertainties) || value.uncertainties.length > 20) return null;
  const uncertainties: string[] = [];
  for (const item of value.uncertainties) {
    const text = safeText(item, 500);
    if (!text) return null;
    uncertainties.push(text);
  }

  return {
    status: value.status as WorkerProviderResultStatus,
    summary,
    evidenceRefs,
    changedPaths,
    providerReportedTests: tests as WorkerProviderReportedTests,
    uncertainties,
    nextAction,
  };
}

function validateLease(
  lease: WorkerLease,
  request: WorkerDispatchRequest,
  nowMs: number,
  minimumRemainingMs: number,
): boolean {
  if (
    !lease ||
    lease.status !== "DISPATCHED" ||
    lease.taskId !== request.taskId ||
    lease.runId !== request.cycleId ||
    lease.correlationId !== request.correlationId ||
    lease.actorId !== request.actorId ||
    lease.workspaceId !== request.workspaceId ||
    lease.projectId !== request.projectId ||
    !nonBlank(lease.attemptId) ||
    !nonBlank(lease.leaseToken) ||
    !Number.isSafeInteger(lease.leaseGeneration) ||
    lease.leaseGeneration < 1
  ) {
    return false;
  }
  const expiry = Date.parse(lease.leaseExpiresAt);
  return Number.isFinite(expiry) && expiry > nowMs + minimumRemainingMs;
}

function outcomeForProviderResult(result: WorkerProviderResult): WorkerCycleOutcome {
  switch (result.status) {
    case "VERIFYING":
      return "REVIEW_REQUIRED";
    case "BLOCKED":
      return "BLOCKED";
    case "PARTIAL":
      return "PARTIAL";
    case "FAILED":
      return "FAILED";
  }
}

function safeFailureMessage(code: WorkerFailureCode): string {
  switch (code) {
    case "EXECUTION_TIMEOUT":
      return "Provider execution exceeded the configured deadline; no result was accepted.";
    case "PROVIDER_RESULT_INVALID":
      return "Provider output failed the structured result, scope, or secret-scrubbing contract.";
    case "PROVIDER_FAILED":
      return "Provider execution failed; raw provider diagnostics were withheld.";
  }
}

function safeCycleError(
  taskId: string,
  attemptId: string,
  code: WorkerGateCode,
  reason: string,
): WorkerCycleResult {
  return { outcome: "PERSISTENCE_UNCONFIRMED", taskId, attemptId, code, reason };
}

export async function runAgentWorkerCycle(input: WorkerCycleInput): Promise<WorkerCycleResult> {
  const taskId = input.taskId;
  if (!input.enabled) {
    return {
      outcome: "DISABLED",
      taskId,
      code: "WORKER_DISABLED",
      reason: "Worker feature flag is not explicitly enabled.",
    };
  }
  if (!UUID_PATTERN.test(input.cycleId)) {
    return held(
      taskId,
      "INVALID_CYCLE_ID",
      "A stable UUID cycle ID is required for durable idempotency.",
    );
  }
  if (
    !Number.isSafeInteger(input.timeoutMs) ||
    input.timeoutMs < MIN_TIMEOUT_MS ||
    input.timeoutMs > WORKER_MAX_TIMEOUT_MS ||
    !Number.isSafeInteger(input.heartbeatIntervalMs) ||
    input.heartbeatIntervalMs < MIN_HEARTBEAT_INTERVAL_MS ||
    input.heartbeatIntervalMs > WORKER_MAX_HEARTBEAT_INTERVAL_MS ||
    input.heartbeatIntervalMs >= input.timeoutMs
  ) {
    return held(
      taskId,
      "INVALID_RUNTIME_BOUNDS",
      "Worker timeout and heartbeat interval are outside the safe bounded range.",
    );
  }

  // Never let a task payload or caller control the clock used for readiness checks.
  const nowMs = Date.now();
  if (!ALLOWED_ENVIRONMENTS.includes(input.environment.kind)) {
    return held(
      taskId,
      "ENVIRONMENT_NOT_ALLOWED",
      "Only a disposable or development environment may be used by this worker runtime.",
    );
  }
  if (!proofIsFresh(input.environment, nowMs, WORKER_MAX_PROOF_AGE_MS)) {
    return held(
      taskId,
      "ENVIRONMENT_NOT_PROVEN",
      "Environment attestation is missing, stale, or lacks a trusted evidence reference.",
    );
  }

  const actorId = input.actor.actorId?.trim();
  if (
    !actorId ||
    (input.actor.source !== "WORKLOAD_IDENTITY" && input.actor.source !== "SERVER_SESSION")
  ) {
    return held(
      taskId,
      "AUTHENTICATION_REQUIRED",
      "A server-verified workload or session identity is required.",
    );
  }

  let task: WorkerTask | null;
  try {
    task = await input.adapters.loadTask(taskId);
  } catch {
    return held(
      taskId,
      "TASK_READ_FAILED",
      "The durable task could not be read; execution is held.",
    );
  }
  if (!task || task.taskId !== taskId) {
    return held(
      taskId,
      "TASK_NOT_FOUND",
      "The requested task is not present in the canonical durable queue.",
    );
  }
  if (task.cancelled || task.status === "CANCELLED") {
    return held(taskId, "TASK_CANCELLED", "Cancelled work cannot be resurrected by a worker.");
  }
  if (task.status !== "READY") {
    return held(taskId, "TASK_NOT_READY", "Only a durable READY task may be dispatched.");
  }
  if (
    !nonBlank(task.objective) ||
    !nonBlank(task.workspaceId) ||
    !nonBlank(task.projectId) ||
    task.scopeIn.length === 0
  ) {
    return held(
      taskId,
      "TASK_SCOPE_INCOMPLETE",
      "Objective, authoritative workspace/project, and non-empty input scope are required.",
    );
  }
  if (task.humanApprovalRequired) {
    return held(
      taskId,
      "HUMAN_APPROVAL_REQUIRED",
      "This task requires an explicit single-use human approval; the autonomous worker cannot consume it.",
    );
  }
  if (HUMAN_GATED_RISKS.includes(task.risk)) {
    return held(
      taskId,
      "RISK_REQUIRES_HUMAN",
      "P0/P1 work is human-gated and cannot be autonomously dispatched.",
    );
  }
  if (AUTONOMY_RANK[task.autonomy] > AUTONOMY_RANK[WORKER_MAX_AUTONOMY]) {
    return held(
      taskId,
      "AUTONOMY_NOT_SUPPORTED",
      "This worker runtime is limited to autonomy levels L0-L2.",
    );
  }

  let scope: Readonly<{ workspaceId: string; projectId: string }> | null;
  try {
    scope = await input.adapters.resolveAuthoritativeScope(actorId);
  } catch {
    return held(
      taskId,
      "SCOPE_AUTHORITY_MISSING",
      "Authoritative application membership could not be resolved.",
    );
  }
  if (!scope || !nonBlank(scope.workspaceId) || !nonBlank(scope.projectId)) {
    return held(
      taskId,
      "SCOPE_AUTHORITY_MISSING",
      "No authoritative application workspace/project membership exists for this actor.",
    );
  }
  if (scope.workspaceId !== task.workspaceId || scope.projectId !== task.projectId) {
    return held(
      taskId,
      "SCOPE_MISMATCH",
      "Resolved actor scope does not exactly match the persisted task scope.",
    );
  }

  let durableProof: WorkerProof;
  let hostedProof: WorkerProof;
  let providerHealth: WorkerProviderHealth;
  let activeAttemptId: string | null;
  try {
    [durableProof, hostedProof, providerHealth, activeAttemptId] = await Promise.all([
      input.adapters.readDurableControlPlaneProof(),
      input.adapters.readHostedSecurityProof(),
      input.adapters.readProviderHealth(input.provider.id),
      input.adapters.findActiveAttempt(taskId),
    ]);
  } catch {
    return held(
      taskId,
      "READINESS_EVIDENCE_UNAVAILABLE",
      "Readiness evidence could not be fetched; execution is held.",
    );
  }

  if (!proofIsFresh(durableProof, Date.now(), WORKER_MAX_PROOF_AGE_MS)) {
    return held(
      taskId,
      "CONTROL_PLANE_UNPROVEN",
      "Durable control-plane proof is absent, stale, or has no trusted evidence reference.",
    );
  }
  if (!proofIsFresh(hostedProof, Date.now(), WORKER_MAX_PROOF_AGE_MS)) {
    return held(
      taskId,
      "HOSTED_SECURITY_UNPROVEN",
      "Hosted security proof is absent, stale, or has no trusted evidence reference.",
    );
  }

  const providerHealthAt = Date.parse(providerHealth.checkedAt);
  if (
    providerHealth.status !== "available" ||
    !Number.isFinite(providerHealthAt) ||
    providerHealthAt > Date.now() + MAX_CLOCK_SKEW_MS ||
    Date.now() - providerHealthAt > WORKER_MAX_PROVIDER_HEALTH_AGE_MS
  ) {
    return held(
      taskId,
      "PROVIDER_UNAVAILABLE",
      "Provider health is unavailable, stale, or not explicitly available.",
    );
  }
  if (activeAttemptId) {
    return held(
      taskId,
      "ACTIVE_ATTEMPT_EXISTS",
      "A durable active attempt already exists for this task.",
    );
  }
  if (input.excludedProviderIds.includes(input.provider.id)) {
    return held(taskId, "PROVIDER_NOT_ELIGIBLE", "Provider is excluded by current policy.");
  }
  const requiredCapability = capabilityForLane(task.lane);
  if (
    !requiredCapability ||
    !input.provider.capabilities.includes(requiredCapability) ||
    AUTONOMY_RANK[task.autonomy] > AUTONOMY_RANK[input.provider.maxAutonomy] ||
    RISK_RANK[task.risk] > RISK_RANK[input.provider.maxRiskWithoutHumanGate]
  ) {
    return held(
      taskId,
      "PROVIDER_NOT_ELIGIBLE",
      "Provider capability, autonomy, or risk ceiling does not cover this task.",
    );
  }

  const correlationId = input.cycleId + ":" + task.taskId;
  if (correlationId.length > 240) {
    return held(
      taskId,
      "INVALID_CYCLE_ID",
      "Cycle/task correlation ID exceeds the durable storage bound.",
    );
  }
  const request: WorkerDispatchRequest = {
    cycleId: input.cycleId,
    correlationId,
    actorId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    taskId: task.taskId,
    providerId: input.provider.id,
    autonomy: task.autonomy,
    risk: task.risk,
  };

  let lease: WorkerLease;
  try {
    lease = await input.adapters.dispatchAtomically(request);
  } catch {
    return {
      outcome: "DISPATCH_REJECTED",
      taskId,
      code: "DISPATCH_REJECTED",
      reason:
        "Atomic durable dispatch was rejected or could not be confirmed; provider execution was not started.",
    };
  }
  // A lease that expires before the first heartbeat cannot safely own provider execution.
  // Require one heartbeat interval plus a small scheduling/network margin.
  if (!validateLease(lease, request, Date.now(), input.heartbeatIntervalMs + 1_000)) {
    // Do not attempt a compensating write with an untrusted or incomplete lease.
    return held(
      taskId,
      "INVALID_LEASE",
      "Dispatch returned an invalid or expired lease; provider execution was not started.",
    );
  }

  const controller = new AbortController();
  let leaseLostFault: Error | null = null;
  let rejectLeaseLost: (error: Error) => void = () => undefined;
  const leaseLostPromise = new Promise<never>((_resolve, reject) => {
    rejectLeaseLost = reject;
  });
  const loseLease = () => {
    if (leaseLostFault) return;
    leaseLostFault = new Error("LEASE_LOST");
    controller.abort(leaseLostFault);
    rejectLeaseLost(leaseLostFault);
  };

  let heartbeatRunning = false;
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  let timeoutTimer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;

  heartbeatTimer = setInterval(() => {
    if (heartbeatRunning || leaseLostFault) return;
    heartbeatRunning = true;
    void Promise.resolve()
      .then(() => input.adapters.heartbeatFenced(lease))
      .then((accepted) => {
        if (!accepted) loseLease();
      })
      .catch(() => loseLease())
      .finally(() => {
        heartbeatRunning = false;
      });
  }, input.heartbeatIntervalMs);

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutTimer = setTimeout(() => {
      timedOut = true;
      const timeoutError = new Error("EXECUTION_TIMEOUT");
      controller.abort(timeoutError);
      reject(timeoutError);
    }, input.timeoutMs);
  });

  const providerContext: WorkerProviderContext = {
    cycleId: input.cycleId,
    attemptId: lease.attemptId,
    taskId: task.taskId,
    correlationId,
    actorId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    leaseGeneration: lease.leaseGeneration,
    deadlineAt: new Date(Date.now() + input.timeoutMs).toISOString(),
    scopeIn: [...task.scopeIn],
    scopeOut: [...task.scopeOut],
  };

  try {
    let rawResult: unknown;
    try {
      rawResult = await Promise.race([
        Promise.resolve().then(() =>
          input.provider.execute(task, providerContext, controller.signal),
        ),
        timeoutPromise,
        leaseLostPromise,
      ]);
    } catch {
      if (leaseLostFault) {
        return {
          outcome: "LEASE_LOST",
          taskId,
          attemptId: lease.attemptId,
          code: "LEASE_LOST",
          reason:
            "Lease heartbeat was rejected or unavailable; provider signal was aborted and no result was accepted.",
        };
      }
      const failureCode: WorkerFailureCode = timedOut ? "EXECUTION_TIMEOUT" : "PROVIDER_FAILED";
      try {
        const persisted = await Promise.race([
          input.adapters.recordFailureFenced(lease, {
            code: failureCode,
            message: safeFailureMessage(failureCode),
          }),
          leaseLostPromise,
        ]);
        if (!persisted) {
          return {
            outcome: "LEASE_LOST",
            taskId,
            attemptId: lease.attemptId,
            code: "LEASE_LOST",
            reason:
              "Failure evidence could not be written because the active lease fence was rejected.",
          };
        }
      } catch {
        if (leaseLostFault) {
          return {
            outcome: "LEASE_LOST",
            taskId,
            attemptId: lease.attemptId,
            code: "LEASE_LOST",
            reason: "Lease was lost before failure evidence could be persisted.",
          };
        }
        return safeCycleError(
          taskId,
          lease.attemptId,
          "PERSISTENCE_UNCONFIRMED",
          "Provider failure occurred but durable failure evidence could not be confirmed.",
        );
      }
      return {
        outcome: timedOut ? "TIMED_OUT" : "PROVIDER_FAILED",
        taskId,
        attemptId: lease.attemptId,
        code: timedOut ? "EXECUTION_TIMEOUT" : "PROVIDER_FAILED",
        reason: safeFailureMessage(failureCode),
      };
    }

    if (leaseLostFault) {
      return {
        outcome: "LEASE_LOST",
        taskId,
        attemptId: lease.attemptId,
        code: "LEASE_LOST",
        reason: "Lease was lost before the provider result could be accepted.",
      };
    }

    const validated = validateWorkerProviderResult(rawResult, task);
    if (!validated) {
      try {
        const persisted = await Promise.race([
          input.adapters.recordFailureFenced(lease, {
            code: "PROVIDER_RESULT_INVALID",
            message: safeFailureMessage("PROVIDER_RESULT_INVALID"),
          }),
          leaseLostPromise,
        ]);
        if (!persisted) {
          return {
            outcome: "LEASE_LOST",
            taskId,
            attemptId: lease.attemptId,
            code: "LEASE_LOST",
            reason:
              "Invalid provider output was not recorded because the lease fence was rejected.",
          };
        }
      } catch {
        if (leaseLostFault) {
          return {
            outcome: "LEASE_LOST",
            taskId,
            attemptId: lease.attemptId,
            code: "LEASE_LOST",
            reason: "Lease was lost before invalid-output evidence could be persisted.",
          };
        }
        return safeCycleError(
          taskId,
          lease.attemptId,
          "PERSISTENCE_UNCONFIRMED",
          "Invalid provider output was detected but the failure record could not be confirmed.",
        );
      }
      return {
        outcome: "INVALID_PROVIDER_RESULT",
        taskId,
        attemptId: lease.attemptId,
        code: "PROVIDER_RESULT_INVALID",
        reason: safeFailureMessage("PROVIDER_RESULT_INVALID"),
      };
    }

    let persisted: boolean;
    try {
      persisted = await Promise.race([
        input.adapters.recordResultFenced(lease, validated),
        leaseLostPromise,
      ]);
    } catch {
      if (leaseLostFault) {
        return {
          outcome: "LEASE_LOST",
          taskId,
          attemptId: lease.attemptId,
          code: "LEASE_LOST",
          reason: "Lease was lost before result evidence could be persisted.",
        };
      }
      return safeCycleError(
        taskId,
        lease.attemptId,
        "PERSISTENCE_UNCONFIRMED",
        "Provider result was produced but durable result persistence could not be confirmed.",
      );
    }
    if (!persisted) {
      return {
        outcome: "LEASE_LOST",
        taskId,
        attemptId: lease.attemptId,
        code: "LEASE_LOST",
        reason: "Durable result write rejected the lease generation/token fence.",
      };
    }

    return {
      outcome: outcomeForProviderResult(validated),
      taskId,
      attemptId: lease.attemptId,
      reason:
        validated.status === "VERIFYING"
          ? "Provider evidence was durably recorded under the active lease; independent verification and human review remain required."
          : "Provider returned a non-success state; durable evidence was recorded without accepting or integrating the task.",
      providerResult: validated,
    };
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (timeoutTimer) clearTimeout(timeoutTimer);
    controller.abort();
  }
}

export interface WorkerProviderContext {
  cycleId: string;
  attemptId: string;
  taskId: string;
  correlationId: string;
  actorId: string;
  workspaceId: string;
  projectId: string;
  leaseGeneration: number;
  deadlineAt: string;
  scopeIn: readonly string[];
  scopeOut: readonly string[];
}
