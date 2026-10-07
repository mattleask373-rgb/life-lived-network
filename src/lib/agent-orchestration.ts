import { createHmac, timingSafeEqual } from "node:crypto";

export type AgentLane = "PRODUCT" | "ARCHITECTURE" | "IMPLEMENTATION" | "QA" | "SECURITY" | "REVIEW";

export type AutonomyLevel = "L0" | "L1" | "L2" | "L3" | "L4";
export type RiskLevel = "P0" | "P1" | "P2" | "P3";

export type TaskLifecycleStatus =
  | "DISCOVERED"
  | "READY"
  | "CLAIMED"
  | "IN_PROGRESS"
  | "VERIFYING"
  | "REVIEW"
  | "ACCEPTED"
  | "BLOCKED"
  | "STALE"
  | "CHANGES_REQUESTED"
  | "ABANDONED"
  | "CANCELLED";

export interface PlaneWebhookEnvelope {
  version: "v2";
  delivery_id: string;
  event_id: string;
  entity_id: string;
  entity_type: string;
  event: string;
  webhook_id: string;
  workspace_id: string;
  data: Record<string, unknown>;
  previous_attributes?: Record<string, unknown>;
}

export interface AgentClaim {
  owner: string;
  backup_owner?: string;
  lease_start: string; // ISO-8601
  lease_expiry: string; // ISO-8601
  last_heartbeat: string; // ISO-8601
  branch?: string;
}

export interface AgentTaskEnvelope {
  task_id: string;
  source: {
    system: "plane";
    workspace_id: string;
    work_item_id: string;
    event_id: string;
  };
  objective: string;
  lane: AgentLane | "ORCHESTRATOR";
  autonomy: AutonomyLevel;
  risk: RiskLevel;
  status: TaskLifecycleStatus;
  scope_in: string[];
  scope_out: string[];
  dependencies: string[];
  acceptance_criteria: string[];
  invariants: string[];
  evidence_required: string[];
  provider: "auto" | string;
  claim: AgentClaim | null;
}

export interface PlaneTaskData {
  id?: string;
  name?: string;
  description?: string | null;
  priority?: string | null;
  labels?: Array<{ name?: string | null }>;
  state?: { name?: string | null; group?: string | null } | null;
}

const LANE_BY_LABEL: Record<string, AgentLane> = {
  "agent-product": "PRODUCT",
  "agent-architecture": "ARCHITECTURE",
  "agent-implementation": "IMPLEMENTATION",
  "agent-qa": "QA",
  "agent-security": "SECURITY",
  "agent-review": "REVIEW",
};

const RISK_BY_PRIORITY: Record<string, RiskLevel> = {
  urgent: "P0",
  high: "P1",
  medium: "P2",
  low: "P3",
  none: "P3",
};

/** Default lease durations in milliseconds, matching CLAIM-LEASE-HEARTBEAT.md */
const LEASE_MS_BY_RISK: Record<RiskLevel, number> = {
  P0: 2 * 60 * 60 * 1000, // 2 h
  P1: 4 * 60 * 60 * 1000, // 4 h
  P2: 4 * 60 * 60 * 1000,
  P3: 6 * 60 * 60 * 1000, // research/audit
};

const HEARTBEAT_GRACE_MS = 45 * 60 * 1000; // 45 min

const DEFAULT_INVARIANTS = [
  "No autonomous merge to main",
  "No second possibility / matching engine",
  "Unknown must not become confirmed",
] as const;

const DEFAULT_EVIDENCE = ["tests", "lint", "build"] as const;

export function verifyPlaneSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  if (!signature || !secret) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export function isAgentReady(event: PlaneWebhookEnvelope): boolean {
  if (!event.event.startsWith("workitem.")) return false;

  const data = event.data as PlaneTaskData;
  const labels = new Set(
    (data.labels ?? [])
      .map((label) => label.name?.toLowerCase())
      .filter((name): name is string => Boolean(name)),
  );

  return labels.has("agent-ready");
}

export function laneFromTask(data: PlaneTaskData): AgentLane | "ORCHESTRATOR" {
  for (const label of data.labels ?? []) {
    const lane = label.name ? LANE_BY_LABEL[label.name.toLowerCase()] : undefined;
    if (lane) return lane;
  }

  return "ORCHESTRATOR";
}

export function riskFromTask(data: PlaneTaskData): RiskLevel {
  return RISK_BY_PRIORITY[data.priority?.toLowerCase() ?? "none"] ?? "P3";
}

/** Default autonomy by risk. P0 stays conservative. */
export function autonomyFromRisk(risk: RiskLevel): AutonomyLevel {
  if (risk === "P0") return "L1";
  if (risk === "P1") return "L2";
  return "L2";
}

export function normalizePlaneTask(event: PlaneWebhookEnvelope, taskId: string): AgentTaskEnvelope {
  const data = event.data as PlaneTaskData;
  const objective = data.description?.trim() || data.name?.trim();

  if (!objective) {
    throw new Error("Agent-ready work item must have an objective");
  }

  const risk = riskFromTask(data);

  return {
    task_id: taskId,
    source: {
      system: "plane",
      workspace_id: event.workspace_id,
      work_item_id: event.entity_id,
      event_id: event.event_id,
    },
    objective,
    lane: laneFromTask(data),
    autonomy: autonomyFromRisk(risk),
    risk,
    status: "READY",
    scope_in: [],
    scope_out: ["main"],
    dependencies: [],
    acceptance_criteria: [],
    invariants: [...DEFAULT_INVARIANTS],
    evidence_required: [...DEFAULT_EVIDENCE],
    provider: "auto",
    claim: null,
  };
}

export function shouldIgnoreDuplicate(
  eventId: string,
  processedEventIds: ReadonlySet<string>,
): boolean {
  return processedEventIds.has(eventId);
}

// ---------------------------------------------------------------------------
// Claim / Lease / Heartbeat (pure functions)
// ---------------------------------------------------------------------------

function nowIso(now: Date = new Date()): string {
  return now.toISOString();
}

function addMs(iso: string, ms: number): string {
  return new Date(new Date(iso).getTime() + ms).toISOString();
}

export function defaultLeaseMs(risk: RiskLevel): number {
  return LEASE_MS_BY_RISK[risk];
}

/**
 * Claim a READY (or STALE) task.
 * Returns a new envelope; never mutates the input.
 * Throws if the task is already owned by a non-stale claim.
 */
export function claimTask(
  task: AgentTaskEnvelope,
  owner: string,
  options?: {
    now?: Date;
    leaseMs?: number;
    branch?: string;
    backup_owner?: string;
  },
): AgentTaskEnvelope {
  const now = options?.now ?? new Date();
  const nowStr = nowIso(now);

  if (task.claim && !isStale(task, now)) {
    throw new Error(
      `Task ${task.task_id} is already claimed by ${task.claim.owner} until ${task.claim.lease_expiry}`,
    );
  }

  if (task.status !== "READY" && task.status !== "STALE" && task.status !== "DISCOVERED") {
    throw new Error(`Task ${task.task_id} cannot be claimed from status ${task.status}`);
  }

  const leaseMs = options?.leaseMs ?? defaultLeaseMs(task.risk);

  const claim: AgentClaim = {
    owner,
    backup_owner: options?.backup_owner,
    lease_start: nowStr,
    lease_expiry: addMs(nowStr, leaseMs),
    last_heartbeat: nowStr,
    branch: options?.branch,
  };

  return {
    ...task,
    status: "CLAIMED",
    claim,
  };
}

/**
 * Record a heartbeat. Extends last_heartbeat; optionally extends lease.
 */
export function heartbeatTask(
  task: AgentTaskEnvelope,
  owner: string,
  options?: { now?: Date; extendLeaseMs?: number },
): AgentTaskEnvelope {
  if (!task.claim) {
    throw new Error(`Task ${task.task_id} has no active claim`);
  }
  if (task.claim.owner !== owner) {
    throw new Error(`Task ${task.task_id} is claimed by ${task.claim.owner}, not ${owner}`);
  }

  const now = options?.now ?? new Date();
  const nowStr = nowIso(now);

  let lease_expiry = task.claim.lease_expiry;
  if (options?.extendLeaseMs && options.extendLeaseMs > 0) {
    lease_expiry = addMs(nowStr, options.extendLeaseMs);
  }

  return {
    ...task,
    status: task.status === "CLAIMED" ? "IN_PROGRESS" : task.status,
    claim: {
      ...task.claim,
      last_heartbeat: nowStr,
      lease_expiry,
    },
  };
}

/**
 * Voluntary release. Returns task to READY (or BLOCKED if reason given).
 */
export function releaseTask(
  task: AgentTaskEnvelope,
  owner: string,
  options?: { reason?: string; blocked?: boolean },
): AgentTaskEnvelope {
  if (!task.claim) {
    throw new Error(`Task ${task.task_id} has no active claim`);
  }
  if (task.claim.owner !== owner) {
    throw new Error(
      `Task ${task.task_id} is claimed by ${task.claim.owner}, not ${owner}`,
    );
  }

  return {
    ...task,
    status: options?.blocked ? "BLOCKED" : "READY",
    claim: null,
  };
}

/**
 * True when lease has expired AND heartbeat grace has also elapsed.
 */
export function isStale(task: AgentTaskEnvelope, now: Date = new Date()): boolean {
  if (!task.claim) return false;

  const nowMs = now.getTime();
  const leaseExpiryMs = new Date(task.claim.lease_expiry).getTime();
  const lastHbMs = new Date(task.claim.last_heartbeat).getTime();

  return nowMs > leaseExpiryMs && nowMs - lastHbMs > HEARTBEAT_GRACE_MS;
}

/**
 * Mark a stale task as STALE (does not clear the claim so work can be inspected).
 */
export function markStale(task: AgentTaskEnvelope, now: Date = new Date()): AgentTaskEnvelope {
  if (!isStale(task, now)) {
    throw new Error(`Task ${task.task_id} is not stale`);
  }
  return {
    ...task,
    status: "STALE",
  };
}

/**
 * Reclaim a STALE task after inspection. Creates a fresh claim.
 */
export function reclaimTask(
  task: AgentTaskEnvelope,
  newOwner: string,
  options?: {
    now?: Date;
    leaseMs?: number;
    branch?: string;
    backup_owner?: string;
  },
): AgentTaskEnvelope {
  if (task.status !== "STALE" && !isStale(task, options?.now)) {
    throw new Error(`Task ${task.task_id} is not stale and cannot be reclaimed without release`);
  }

  // Clear old claim first, then claim as READY
  const cleared: AgentTaskEnvelope = {
    ...task,
    status: "READY",
    claim: null,
  };

  return claimTask(cleared, newOwner, options);
}
