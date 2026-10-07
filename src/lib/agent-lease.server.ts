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

export async function heartbeatAgentTask(
  taskId: string,
  owner: string,
): Promise<AgentTaskRow | null> {
  const rows = await rpc<AgentTaskRow>("heartbeat_agent_task", {
    requested_task_id: taskId,
    requested_owner: owner,
  });
  return rows[0] ?? null;
}

export async function releaseAgentTask(
  taskId: string,
  owner: string,
  nextStatus: "READY" | "BLOCKED" = "READY",
): Promise<AgentTaskRow | null> {
  const rows = await rpc<AgentTaskRow>("release_agent_task", {
    requested_task_id: taskId,
    requested_owner: owner,
    next_status: nextStatus,
  });
  return rows[0] ?? null;
}
