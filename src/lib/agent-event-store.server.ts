type SupabaseRow = Record<string, unknown>;

function config() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Missing Supabase environment for agent control plane");
  return { url: url.replace(/\/$/, ""), key };
}

async function rest(path: string, init?: RequestInit): Promise<Response> {
  const { url, key } = config();
  return fetch(\`${url}/rest/v1/${path}\`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: \`Bearer ${key}\`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init?.headers,
    },
  });
}

async function assertOk(response: Response): Promise<void> {
  if (!response.ok) throw new Error(\`Agent control-plane storage failed (${response.status})\`);
}

export async function hasAgentEvent(eventId: string): Promise<boolean> {
  const response = await rest(\`agent_events?select=event_id&event_id=eq.${encodeURIComponent(eventId)}&limit=1\`);
  await assertOk(response);
  const rows = (await response.json()) as SupabaseRow[];
  return rows.length > 0;
}

export async function recordAgentEvent(input: {
  eventId: string; deliveryId: string; webhookId: string; eventType: string;
  entityId: string; workspaceId: string; payload: unknown;
}): Promise<boolean> {
  const response = await rest("agent_events", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({
      event_id: input.eventId, delivery_id: input.deliveryId, webhook_id: input.webhookId,
      event_type: input.eventType, entity_id: input.entityId, workspace_id: input.workspaceId,
      raw_payload: input.payload,
    }),
  });
  await assertOk(response);
  const rows = (await response.json()) as SupabaseRow[];
  return rows.length > 0;
}

export async function recordNormalizedAgentTask(task: unknown, eventId: string): Promise<void> {
  const value = task as {
    task_id: string; source: { workspace_id: string; work_item_id: string };
    objective: string; lane: string; autonomy: string; risk: string; provider: string;
  };
  const response = await rest("agent_tasks", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({
      task_id: value.task_id, event_id: eventId, workspace_id: value.source.workspace_id,
      work_item_id: value.source.work_item_id, objective: value.objective, lane: value.lane,
      autonomy: value.autonomy, risk: value.risk, provider: value.provider, envelope: task,
    }),
  });
  await assertOk(response);
}

export async function markAgentEvent(
  eventId: string, status: "ignored" | "normalized" | "failed", error?: string,
): Promise<void> {
  const response = await rest(\`agent_events?event_id=eq.${encodeURIComponent(eventId)}\`, {
    method: "PATCH",
    body: JSON.stringify({ status, processed_at: new Date().toISOString(), error: error ?? null }),
  });
  await assertOk(response);
}
