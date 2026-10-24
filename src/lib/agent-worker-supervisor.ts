/**
 * Persistent-loop policy core for the canonical agent worker.
 *
 * This module deliberately owns no task queue, lease, identity, credentials,
 * or database state. The caller must adapt these operations to the existing
 * durable control plane and fenced worker runtime. One supervisor instance
 * runs at most one task cycle at a time.
 *
 * It is not, by itself, a deployed or proven 24/7 service.
 */
import type { WorkerCycleResult } from "./agent-worker-runtime";

export type AgentWorkerSupervisorStatus = "IDLE" | "PAUSED" | "RUNNING" | "DEGRADED" | "STOPPED";

export interface AgentWorkerSupervisorOptions {
  /** Delay between completed cycles, including when the durable queue is empty. */
  pollIntervalMs: number;
  /** Upper bound for exponential retry delay after infrastructure/runtime failures. */
  maxBackoffMs: number;
}

export interface AgentWorkerSupervisorHeartbeat {
  status: AgentWorkerSupervisorStatus;
  checkedAt: string;
  completedCycles: number;
  consecutiveFailures: number;
  lastOutcome?: WorkerCycleResult["outcome"];
}

export interface AgentWorkerSupervisorAdapters {
  /** Read the server-side, operator-controlled kill switch on every tick. */
  readEnabled(): Promise<boolean>;
  /**
   * Return one eligible task ID from the canonical durable task store, or null.
   * This must be a bounded, deterministic read; it must not create local task state.
   */
  selectNextReadyTask(): Promise<string | null>;
  /** Generate a new UUID for this scheduler invocation; never reuse caller input. */
  createCycleId(): string;
  /** Call the existing bounded worker runtime with its server-only adapters. */
  runCycle(taskId: string, cycleId: string): Promise<WorkerCycleResult>;
  /**
   * Persist redacted liveness only. Do not include task content, provider output,
   * raw exceptions, lease tokens, credentials, or private actor claims.
   */
  writeHeartbeat(heartbeat: AgentWorkerSupervisorHeartbeat): Promise<void>;
  now?: () => Date;
  random?: () => number;
  sleep?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}

export interface AgentWorkerSupervisorSummary {
  status: "STOPPED";
  completedCycles: number;
  consecutiveFailures: number;
  lastOutcome?: WorkerCycleResult["outcome"];
  stoppedAt: string;
}

const DEFAULT_OPTIONS: AgentWorkerSupervisorOptions = {
  pollIntervalMs: 10_000,
  maxBackoffMs: 300_000,
};
const MIN_POLL_INTERVAL_MS = 250;
const MAX_POLL_INTERVAL_MS = 60_000;
const MAX_BACKOFF_MS = 300_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BACKOFF_OUTCOMES: ReadonlySet<WorkerCycleResult["outcome"]> = new Set([
  "DISABLED",
  "HELD",
  "DISPATCH_REJECTED",
  "LEASE_LOST",
  "TIMED_OUT",
  "PROVIDER_FAILED",
  "INVALID_PROVIDER_RESULT",
  "PERSISTENCE_UNCONFIRMED",
]);

function isNonBlankTaskId(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 200) {
    return false;
  }
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 31 || code === 127) return false;
  }
  return true;
}

function validateOptions(options: AgentWorkerSupervisorOptions): void {
  if (
    !Number.isSafeInteger(options.pollIntervalMs) ||
    options.pollIntervalMs < MIN_POLL_INTERVAL_MS ||
    options.pollIntervalMs > MAX_POLL_INTERVAL_MS
  ) {
    throw new Error("Supervisor polling interval is outside the allowed range.");
  }
  if (
    !Number.isSafeInteger(options.maxBackoffMs) ||
    options.maxBackoffMs < options.pollIntervalMs ||
    options.maxBackoffMs > MAX_BACKOFF_MS
  ) {
    throw new Error("Supervisor backoff ceiling is outside the allowed range.");
  }
}

function sleepWithAbort(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };

    timer = setTimeout(finish, milliseconds);
    signal.addEventListener("abort", finish, { once: true });
  });
}

function backoffDelay(
  options: AgentWorkerSupervisorOptions,
  consecutiveFailures: number,
  random: () => number,
): number {
  const exponent = Math.min(Math.max(consecutiveFailures - 1, 0), 20);
  const base = Math.min(options.maxBackoffMs, options.pollIntervalMs * 2 ** exponent);
  const sample = random();
  const normalized = Number.isFinite(sample) ? Math.max(0, Math.min(1, sample)) : 0.5;
  const jittered = Math.round(base * (0.75 + normalized * 0.5));
  return Math.min(options.maxBackoffMs, Math.max(options.pollIntervalMs, jittered));
}

function snapshot(
  status: AgentWorkerSupervisorStatus,
  checkedAt: Date,
  completedCycles: number,
  consecutiveFailures: number,
  lastOutcome: WorkerCycleResult["outcome"] | undefined,
): AgentWorkerSupervisorHeartbeat {
  return {
    status,
    checkedAt: checkedAt.toISOString(),
    completedCycles,
    consecutiveFailures,
    ...(lastOutcome ? { lastOutcome } : {}),
  };
}

async function tryWriteHeartbeat(
  adapters: AgentWorkerSupervisorAdapters,
  heartbeat: AgentWorkerSupervisorHeartbeat,
): Promise<boolean> {
  try {
    await adapters.writeHeartbeat(heartbeat);
    return true;
  } catch {
    // Do not leak storage diagnostics. The caller records a degraded state and backs off.
    return false;
  }
}

export async function runAgentWorkerSupervisor(
  adapters: AgentWorkerSupervisorAdapters,
  signal: AbortSignal,
  requestedOptions: Partial<AgentWorkerSupervisorOptions> = {},
): Promise<AgentWorkerSupervisorSummary> {
  const options = { ...DEFAULT_OPTIONS, ...requestedOptions };
  validateOptions(options);

  const now = adapters.now ?? (() => new Date());
  const random = adapters.random ?? Math.random;
  const sleep = adapters.sleep ?? sleepWithAbort;

  let completedCycles = 0;
  let consecutiveFailures = 0;
  let lastOutcome: WorkerCycleResult["outcome"] | undefined;

  while (!signal.aborted) {
    let status: AgentWorkerSupervisorStatus;

    try {
      const enabled = await adapters.readEnabled();
      if (!enabled) {
        // A closed kill switch is an intentional pause, not a failure.
        status = "PAUSED";
      } else {
        const taskId = await adapters.selectNextReadyTask();
        if (taskId === null) {
          status = "IDLE";
        } else {
          if (!isNonBlankTaskId(taskId)) {
            throw new Error("Durable task selector returned an invalid identifier.");
          }

          const cycleId = adapters.createCycleId();
          if (!UUID_PATTERN.test(cycleId)) {
            throw new Error("Supervisor cycle identifier is not a UUID.");
          }

          // Require durable liveness before executing anything. If the heartbeat
          // cannot be persisted, do not begin a task cycle.
          const running = snapshot(
            "RUNNING",
            now(),
            completedCycles,
            consecutiveFailures,
            lastOutcome,
          );
          if (!(await tryWriteHeartbeat(adapters, running))) {
            throw new Error("Supervisor liveness could not be persisted.");
          }

          // Cancellation stops new dispatches. An in-flight runtime cycle remains
          // bounded by that runtime's own hard timeout and provider cancellation.
          if (signal.aborted) break;

          const result = await adapters.runCycle(taskId, cycleId);
          if (!result || typeof result.outcome !== "string") {
            throw new Error("Worker runtime returned an invalid result.");
          }

          completedCycles += 1;
          lastOutcome = result.outcome;

          if (BACKOFF_OUTCOMES.has(result.outcome)) {
            consecutiveFailures += 1;
            status = "DEGRADED";
          } else {
            status = "IDLE";
          }
        }
      }
    } catch {
      // Never persist raw exception text; it can contain SQL/provider diagnostics or secrets.
      consecutiveFailures += 1;
      status = "DEGRADED";
    }

    const heartbeat = snapshot(status, now(), completedCycles, consecutiveFailures, lastOutcome);
    if (!(await tryWriteHeartbeat(adapters, heartbeat))) {
      consecutiveFailures += 1;
    } else if (status !== "DEGRADED") {
      // A tick is healthy only after its final liveness write succeeds.
      consecutiveFailures = 0;
    }

    const delay =
      consecutiveFailures > 0
        ? backoffDelay(options, consecutiveFailures, random)
        : options.pollIntervalMs;
    await sleep(delay, signal);
  }

  const stoppedAt = now().toISOString();
  await tryWriteHeartbeat(
    adapters,
    snapshot("STOPPED", now(), completedCycles, consecutiveFailures, lastOutcome),
  );

  return {
    status: "STOPPED",
    completedCycles,
    consecutiveFailures,
    ...(lastOutcome ? { lastOutcome } : {}),
    stoppedAt,
  };
}
