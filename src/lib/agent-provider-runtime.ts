import type { AgentExecutionResult } from "./agent-execution-contract";
import { validateExecutionResult } from "./agent-execution-contract";
import type { AgentProvider, ProviderHealth } from "./agent-provider";
import type { AgentTaskEnvelope } from "./agent-orchestration";

export type ProviderFailureClass =
  | "AUTHENTICATION_FAILURE"
  | "AUTHORIZATION_FAILURE"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_MALFORMED"
  | "UNKNOWN";

export type ProviderExecutionEnvelope = Readonly<{
  result: AgentExecutionResult;
  providerId: string;
  failureClass?: ProviderFailureClass;
  startedAt: string;
  finishedAt: string;
}>;

export type ProviderExecutionOptions = Readonly<{
  timeoutMs?: number;
  signal?: AbortSignal;
}>;

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

function classifyProviderError(error: unknown): ProviderFailureClass {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("unauthorized") || message.includes("authentication") || message.includes("401")) {
    return "AUTHENTICATION_FAILURE";
  }
  if (message.includes("forbidden") || message.includes("authorization") || message.includes("403")) {
    return "AUTHORIZATION_FAILURE";
  }
  if (message.includes("timeout") || message.includes("timed out")) {
    return "PROVIDER_TIMEOUT";
  }
  if (message.includes("unavailable") || message.includes("503") || message.includes("429")) {
    return "PROVIDER_UNAVAILABLE";
  }
  return "UNKNOWN";
}

function failureResult(
  taskId: string,
  providerId: string,
  summary: string,
  failureClass: ProviderFailureClass,
): AgentExecutionResult {
  return {
    taskId,
    status: "FAILED",
    summary,
    changedPaths: [],
    testsRun: [],
    testsPassed: 0,
    testsFailed: 0,
    claims: [],
    uncertainties: [`provider execution did not establish task completion: ${failureClass}`],
    blockers: [summary],
    handoff: `Provider ${providerId} did not produce an acceptable execution result. Preserve the attempt as failed and reconcile before retrying.`,
    recommendedNextAction: "Inspect the durable attempt evidence and apply the retry policy; do not treat this attempt as successful.",
    provider: { id: providerId },
  };
}

/**
 * Provider runtime boundary.
 *
 * This is deliberately provider-neutral: it invokes an injected AgentProvider,
 * validates the returned evidence contract, and converts execution failures into
 * explicit durable-state-friendly outcomes. It never promotes provider output to
 * DONE/ACCEPTED/INTEGRATED and never performs merge/deploy actions.
 */
export async function executeProviderAttempt(
  provider: AgentProvider,
  task: AgentTaskEnvelope,
  options: ProviderExecutionOptions = {},
): Promise<ProviderExecutionEnvelope> {
  const started = new Date();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onAbort, { once: true });

  let result: AgentExecutionResult;

  try {
    const health: ProviderHealth = await provider.health();
    if (health.status === "unavailable") {
      const failureClass: ProviderFailureClass = "PROVIDER_UNAVAILABLE";
      result = failureResult(
        task.task_id,
        provider.id,
        health.detail?.trim() || `Provider ${provider.id} is unavailable`,
        failureClass,
      );
    } else {
      result = await provider.execute(task, controller.signal);
      const issues = validateExecutionResult(result);
      if (issues.length > 0 || result.taskId !== task.task_id) {
        const details = issues.map((issue) => issue.code).join(", ");
        result = failureResult(
          task.task_id,
          provider.id,
          `Provider returned malformed execution evidence${details ? `: ${details}` : ""}`,
          "PROVIDER_MALFORMED",
        );
      }
    }
  } catch (error) {
    const aborted = controller.signal.aborted;
    const failureClass: ProviderFailureClass = aborted ? "PROVIDER_TIMEOUT" : classifyProviderError(error);
    const detail = error instanceof Error ? error.message : String(error);
    result = failureResult(
      task.task_id,
      provider.id,
      aborted ? `Provider execution exceeded the ${timeoutMs}ms timeout` : detail,
      failureClass,
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onAbort);
  }

  const finished = new Date();
  return {
    result,
    providerId: provider.id,
    ...(result.status === "FAILED" ? { failureClass: result.uncertainties[0]?.includes("PROVIDER_UNAVAILABLE") ? "PROVIDER_UNAVAILABLE" : undefined } : {}),
    startedAt: started.toISOString(),
    finishedAt: finished.toISOString(),
  };
}
