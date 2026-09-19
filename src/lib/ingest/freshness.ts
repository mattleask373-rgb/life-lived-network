/**
 * How alive an imported event is.
 *
 * Time-based, from real timestamps only — never a guess and never a score. An
 * event that has finished stops being something to go to, but keeps everything
 * we know about where it came from.
 */

import type { DataQuality } from "../world-data";
import type { SourceState } from "./contract";

export type EventFreshness =
  | "recently_updated"
  | "current"
  | "aging"
  | "may_have_changed"
  | "expired";

export interface FreshnessInput {
  /** When we last read this at the source. */
  lastCheckedAt: string | null;
  /** When the source itself last changed it, if it says. */
  sourceUpdatedAt?: string | null;
  startsAt: string;
  endsAt?: string | null;
  /** How often this source is allowed to be refreshed. */
  refreshMinutes: number;
  now?: Date;
}

const HOUR = 3600000;

export function eventFreshness(input: FreshnessInput): EventFreshness {
  const now = input.now ?? new Date();
  const finishes = new Date(input.endsAt ?? input.startsAt).getTime();
  if (Number.isFinite(finishes) && finishes < now.getTime()) return "expired";

  if (!input.lastCheckedAt) return "may_have_changed";
  const checkedAgo = now.getTime() - new Date(input.lastCheckedAt).getTime();
  if (!Number.isFinite(checkedAgo) || checkedAgo < 0) return "may_have_changed";

  const window = Math.max(input.refreshMinutes, 15) * 60000;
  const updatedAgo = input.sourceUpdatedAt
    ? now.getTime() - new Date(input.sourceUpdatedAt).getTime()
    : Number.POSITIVE_INFINITY;

  if (updatedAgo <= 24 * HOUR && checkedAgo <= window) return "recently_updated";
  if (checkedAgo <= window) return "current";
  if (checkedAgo <= window * 3) return "aging";
  return "may_have_changed";
}

/** The honesty label the interface already knows how to show. */
export function qualityFor(freshness: EventFreshness): DataQuality {
  switch (freshness) {
    case "recently_updated":
      return "recently updated";
    case "current":
      return "unverified";
    case "aging":
      return "unverified";
    case "may_have_changed":
      return "may have changed";
    case "expired":
      return "expired";
  }
}

/**
 * Whether this belongs in "what's happening". Cancelled and postponed leave at
 * once and say why; finished events leave quietly. Neither is deleted.
 */
export function discoverable(input: {
  freshness: EventFreshness;
  sourceState: SourceState;
}): boolean {
  if (input.sourceState !== "live") return false;
  return input.freshness !== "expired";
}

export function cancellationFor(state: SourceState): "" | "cancelled" | "postponed" {
  if (state === "cancelled" || state === "removed") return "cancelled";
  if (state === "postponed") return "postponed";
  return "";
}
