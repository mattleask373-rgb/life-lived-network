import type { AuthenticatedExecutionContext } from "./agent-execution-identity";

export type ReclaimStaleRequest = Readonly<{
  taskId: string;
  projectId: string;
}>;

export type ReclaimStaleResult = Readonly<{
  taskId: string;
  status: "READY";
  leaseGeneration: number;
  leaseToken: string;
  abandonedAttemptCount: number;
}>;

/**
 * Server-only reclaim adapter.
 * Requires authoritative STALE (enforced in SQL). Abandons prior-generation
 * active attempts in the same transaction as generation rotation.
 * Does not dispatch providers or grant LIVE production authority.
 */
export async function reclaimStaleAgentTask(
  context: AuthenticatedExecutionContext,
  request: ReclaimStaleRequest,
): Promise<ReclaimStaleResult> {
  if (!context.actorId || !context.workspaceId) {
    throw new Error("authenticated execution context is required");
  }
  if (!request.taskId?.trim() || !request.projectId?.trim()) {
    throw new Error("taskId and projectId are required");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin.rpc("reclaim_stale_agent_task", {
    requested_task_id: request.taskId,
    requested_actor_id: context.actorId,
    requested_workspace_id: context.workspaceId,
    requested_project_id: request.projectId,
    requested_run_id: context.runId ?? null,
  });

  if (error) {
    throw new Error(`reclaim rejected: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("reclaim returned no row");

  return {
    taskId: String(row.task_id),
    status: "READY",
    leaseGeneration: Number(row.lease_generation),
    leaseToken: String(row.lease_token),
    abandonedAttemptCount: Number(row.abandoned_attempt_count ?? 0),
  };
}
