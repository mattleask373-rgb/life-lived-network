type AgentTaskRow = Record<string, unknown>;

function config() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Missing Supabase environment for agent control plane");
  return { url: url.replace(/\/$/, ""), key };
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T[]> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Agent lease operation failed (${response.status})`);
  }
  return (await response.json()) as T[];
}

export async function claimAgentTask(
  taskId: string,
  owner: string,
  leaseMinutes = 240,
): Promise<AgentTaskRow | null> {
  const rows = await rpc<AgentTaskRow>("claim_agent_task", {
    requested_task_id: taskId,
    requested_owner: owner,
    lease_minutes: leaseMinutes,
  });
  return rows[0] ?? null;
}

/**
 * Sliding-lease heartbeat: successful call extends lease_expiry by extendMinutes.
 * Fails (returns null) if owner mismatch, status not active, or lease already expired.
 * Expired owner cannot resurrect ownership via heartbeat — must STALE → reclaim.
 */
export async function heartbeatAgentTask(
  taskId: string,
  owner: string,
  leaseGeneration: number,
  leaseToken: string,
  extendMinutes = 240,
): Promise<AgentTaskRow | null> {
  const rows = await rpc<AgentTaskRow>("heartbeat_agent_task", {
    requested_task_id: taskId,
    requested_owner: owner,
    extend_minutes: extendMinutes,
    requested_lease_generation: leaseGeneration,
    requested_lease_token: leaseToken,
  });
  return rows[0] ?? null;
}

export async function releaseAgentTask(
  taskId: string,
  owner: string,
  leaseGeneration: number,
  leaseToken: string,
  nextStatus: "READY" | "BLOCKED" = "READY",
): Promise<AgentTaskRow | null> {
  const rows = await rpc<AgentTaskRow>("release_agent_task", {
    requested_task_id: taskId,
    requested_owner: owner,
    next_status: nextStatus,
    requested_lease_generation: leaseGeneration,
    requested_lease_token: leaseToken,
  });
  return rows[0] ?? null;
}

/** System recovery: mark tasks STALE when lease expired and heartbeat grace exceeded. */
export async function markStaleAgentTasks(heartbeatGraceMinutes = 45): Promise<AgentTaskRow[]> {
  return rpc<AgentTaskRow>("mark_stale_agent_tasks", {
    heartbeat_grace_minutes: heartbeatGraceMinutes,
  });
}

/** Reclaim only from STALE or READY. Never overwrites live non-stale ownership. */
export async function reclaimAgentTask(
  taskId: string,
  owner: string,
  leaseMinutes = 240,
): Promise<AgentTaskRow | null> {
  const rows = await rpc<AgentTaskRow>("reclaim_agent_task", {
    requested_task_id: taskId,
    requested_owner: owner,
    lease_minutes: leaseMinutes,
  });
  return rows[0] ?? null;
}

/**
 * Guarded status transition. Enforces LEGAL_TRANSITIONS (see agent-state-machine.ts).
 * Throws on illegal transition / role / lease failure (RPC raises).
 */
export async function transitionAgentTask(input: {
  taskId: string;
  actor: string;
  toStatus: string;
  evidence?: Record<string, unknown> | null;
  reviewer?: string | null;
  leaseGeneration?: number | null;
  leaseToken?: string | null;
}): Promise<AgentTaskRow | null> {
  const rows = await rpc<AgentTaskRow>("transition_agent_task", {
    requested_task_id: input.taskId,
    actor: input.actor,
    to_status: input.toStatus,
    evidence: input.evidence ?? null,
    reviewer: input.reviewer ?? null,
    requested_lease_generation: input.leaseGeneration ?? null,
    requested_lease_token: input.leaseToken ?? null,
  });
  return rows[0] ?? null;
}
