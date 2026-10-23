export type DraftQuotaDecision =
  | { allowed: true }
  | {
      allowed: false;
      limitKind: "hourly" | "daily";
      retryAfterSeconds: number;
    }
  | { allowed: false; limitKind: "unavailable" };

/**
 * Parse the one-row result returned by the database quota function.
 * Unknown, malformed or missing results are unavailable, never permission to spend.
 */
export function parseDraftQuotaResponse(data: unknown): DraftQuotaDecision | null {
  if (!Array.isArray(data) || data.length !== 1) return null;

  const row: unknown = data[0];
  if (typeof row !== "object" || row === null) return null;
  const result = row as {
    allowed?: unknown;
    retry_after_seconds?: unknown;
    limit_kind?: unknown;
  };
  if (
    typeof result.allowed !== "boolean" ||
    typeof result.retry_after_seconds !== "number" ||
    !Number.isSafeInteger(result.retry_after_seconds) ||
    result.retry_after_seconds < 0 ||
    typeof result.limit_kind !== "string"
  ) {
    return null;
  }

  if (result.allowed) {
    return result.limit_kind === "allowed" && result.retry_after_seconds === 0
      ? { allowed: true }
      : null;
  }

  if (result.limit_kind === "hourly" || result.limit_kind === "daily") {
    return result.retry_after_seconds > 0
      ? {
          allowed: false,
          limitKind: result.limit_kind,
          retryAfterSeconds: result.retry_after_seconds,
        }
      : null;
  }

  if (result.limit_kind === "unauthenticated") {
    return { allowed: false, limitKind: "unavailable" };
  }

  return null;
}

export function draftQuotaRetryMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `You've reached the safe drafting limit for now. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}. You can still write it yourself.`;
}
