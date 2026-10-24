/**
 * Refuse to interpret a failed database operation as an empty result or success.
 *
 * Use only with a static operation label. Raw provider/database diagnostics may
 * contain identifiers or sensitive details and must not be copied into error
 * messages persisted by the ingest health panel.
 */
export function requireIngestStorageSuccess(error: unknown, operation: string): void {
  if (error !== null && error !== undefined) {
    throw new Error(`Ingest storage operation could not be confirmed: ${operation}.`);
  }
}

import type { IngestOutcome } from "./contract";

/**
 * Mark an ingest run as failed when persistence was not confirmed.
 *
 * Kept separate so callers cannot count an event-storage failure as a
 * successful source refresh just because it was caught to keep the run bounded.
 */
export function markIngestStorageFailure(outcome: IngestOutcome): void {
  outcome.failure = "One or more event storage operations could not be confirmed.";
  outcome.skipped.push("An event was not stored because persistence could not be confirmed.");
}
