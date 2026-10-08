import type { AuthenticatedExecutionContext } from "./agent-execution-identity";

export type AttemptResultRequest = Readonly<{
  attemptId: string;
  taskId: string;
  projectId: string;
  leaseGeneration: number;
  leaseToken: string;
  status: "VERIFYING" | "FAILED";
  evidence?: unknown;
}>;

/**
 * Server-only adapter for recording provider evidence against the current
 * durable attempt fence. It never accepts browser/client identity and never
 * grants acceptance or integration authority.
 */
export async function recordAgentAttemptResult(
  context: AuthenticatedExecutionContext,
  request: AttemptResultRequest,
): Promise<Readonly<{ attemptId: string; status: "VERIFYING" | "FAILED" }>> {
  if (!context.actorId || !context.runId || !context.workspaceId) {
    throw new Error("authenticated execution context is required");
  }
  if (
    !request.attemptId ||
    !request.taskId ||
    !request.projectId ||
    !request.leaseToken ||
    !Number.isSafeInteger(request.leaseGeneration) ||
    request.leaseGeneration < 1
  ) {
    throw new Error("attempt identity, scope, and lease fence are required");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin.rpc("record_agent_attempt_result", {
    requested_attempt_id: request.attemptId,
    requested_run_id: context.runId,
    requested_task_id: request.taskId,
    requested_actor_id: context.actorId,
    requested_workspace_id: context.workspaceId,
    requested_project_id: request.projectId,
    requested_lease_generation: request.leaseGeneration,
    requested_lease_token: request.leaseToken,
    requested_status: request.status,
    requested_evidence: request.evidence ?? {},
  });

  if (error) {
    throw new Error(`attempt result rejected: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("attempt result returned no attempt");

  return {
    attemptId: String(row.attempt_id),
    status: row.status === "FAILED" ? "FAILED" : "VERIFYING",
  };
}
