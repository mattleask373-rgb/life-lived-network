import type { AuthenticatedExecutionContext } from "./agent-execution-identity";

export type DispatchRequest = Readonly<{
  taskId: string;
  providerId: string;
  projectId: string;
}>;

export type DispatchAttempt = Readonly<{
  attemptId: string;
  taskId: string;
  runId: string;
  workspaceId: string;
  projectId: string;
  leaseGeneration: number;
  leaseToken: string;
  status: "DISPATCHED";
  correlationId: string;
}>;

/**
 * Server-only dispatch adapter.
 *
 * Authentication is deliberately upstream: the caller must provide an
 * AuthenticatedExecutionContext produced by the repository's authenticated
 * server middleware. This module never accepts a browser-supplied actor id.
 */
export async function dispatchAgentAttempt(
  context: AuthenticatedExecutionContext,
  request: DispatchRequest,
): Promise<DispatchAttempt> {
  if (!context.actorId || !context.runId || !context.workspaceId || !context.correlationId) {
    throw new Error("authenticated execution context is required");
  }
  if (!request.taskId || !request.providerId || !request.projectId) {
    throw new Error("task, provider, and project scope are required");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin.rpc("dispatch_agent_attempt", {
    requested_task_id: request.taskId,
    requested_run_id: context.runId,
    requested_actor_id: context.actorId,
    requested_workspace_id: context.workspaceId,
    requested_project_id: request.projectId,
    requested_provider_id: request.providerId,
    requested_correlation_id: context.correlationId,
  });

  if (error) {
    throw new Error(`dispatch failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("dispatch returned no attempt");

  return {
    attemptId: String(row.attempt_id),
    taskId: String(row.task_id),
    runId: String(row.run_id),
    workspaceId: String(row.workspace_id),
    projectId: String(row.project_id),
    leaseGeneration: Number(row.lease_generation),
    leaseToken: String(row.lease_token),
    status: "DISPATCHED",
    correlationId: String(row.correlation_id),
  };
}
