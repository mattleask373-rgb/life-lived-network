/**
 * Plain-language health of a configured outside-source refresh.
 *
 * This describes the source connection, not the truth of any individual event.
 * It is derived only from recorded source status and successful-refresh times.
 */
export type SourceHealthState =
  | "paused"
  | "needs_setup"
  | "failing"
  | "never_checked"
  | "never_succeeded"
  | "current"
  | "due"
  | "overdue"
  | "unknown";

export interface SourceHealthInput {
  enabled: boolean;
  status: string;
  credentialRequired: boolean;
  credentialPresent: boolean;
  refreshMinutes: number;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  consecutiveFailures: number;
  now?: Date;
}

export interface SourceHealth {
  state: SourceHealthState;
  label: string;
  explanation: string;
}

const MINUTE = 60_000;

function result(state: SourceHealthState, label: string, explanation: string): SourceHealth {
  return { state, label, explanation };
}

/**
 * Calculate source-level refresh health.
 *
 * "Current" means a successful check fell inside the configured interval. It
 * does not guarantee any particular event remains available or unchanged.
 */
export function sourceHealth(input: SourceHealthInput): SourceHealth {
  if (!input.enabled) {
    return result("paused", "Paused", "This source is disabled.");
  }

  if (input.status !== "ready" || (input.credentialRequired && !input.credentialPresent)) {
    return result(
      "needs_setup",
      "Needs setup",
      "The source is not ready or its required connection is missing.",
    );
  }

  if (input.consecutiveFailures > 0) {
    return result(
      "failing",
      "Refresh failing",
      `${input.consecutiveFailures} consecutive refresh failure${input.consecutiveFailures === 1 ? "" : "s"}; existing records are left unchanged.`,
    );
  }

  if (!input.lastSuccessAt) {
    return input.lastRunAt
      ? result(
          "never_succeeded",
          "No successful refresh yet",
          "A refresh was attempted, but none has succeeded.",
        )
      : result("never_checked", "Not yet checked", "No refresh attempt has been recorded.");
  }

  const now = (input.now ?? new Date()).getTime();
  const lastSuccess = Date.parse(input.lastSuccessAt);
  if (
    !Number.isFinite(now) ||
    !Number.isFinite(lastSuccess) ||
    lastSuccess > now ||
    !Number.isFinite(input.refreshMinutes) ||
    input.refreshMinutes < 1
  ) {
    return result(
      "unknown",
      "Unknown",
      "The refresh timestamp or configured interval is invalid; health cannot be determined.",
    );
  }

  const interval = input.refreshMinutes * MINUTE;
  const age = now - lastSuccess;
  if (age <= interval) {
    return result(
      "current",
      "Within refresh window",
      "The last successful refresh is within the configured interval.",
    );
  }
  if (age <= interval * 3) {
    return result(
      "due",
      "Refresh due",
      "The last successful refresh is older than the configured interval.",
    );
  }
  return result(
    "overdue",
    "Overdue",
    "The last successful refresh is more than three configured intervals old.",
  );
}
