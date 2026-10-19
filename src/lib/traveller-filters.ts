/**
 * Quick filters for people passing through a place: free things, things that
 * pay, things happening this week, things that fit a short window.
 *
 * These are plain, honest predicates over fields already recorded on an
 * entry — no inference, no ranking, no new discovery path. An entry that
 * does not say when it happens is never claimed to be "this week".
 */

import type { WorldEntry } from "./world-data";

export type TravellerFilterId = "free" | "paid" | "this-week" | "short";

export const TRAVELLER_FILTERS: { id: TravellerFilterId; label: string }[] = [
  { id: "free", label: "Free" },
  { id: "paid", label: "Pays you" },
  { id: "this-week", label: "This week" },
  { id: "short", label: "Under 2 hours" },
];

const WEEK_MS = 7 * 24 * 3600_000;
const SHORT_MINUTES = 120;

export function matchesTravellerFilter(
  entry: WorldEntry,
  filter: TravellerFilterId,
  now = Date.now(),
): boolean {
  switch (filter) {
    case "free":
      return entry.cost === 0;
    case "paid":
      return entry.cost < 0;
    case "this-week": {
      if (!entry.startsAt || entry.cancellation) return false;
      const at = Date.parse(entry.startsAt);
      return Number.isFinite(at) && at >= now - 3 * 3600_000 && at <= now + WEEK_MS;
    }
    case "short":
      return entry.minutes > 0 && entry.minutes <= SHORT_MINUTES;
  }
}

/** Active filters all apply (AND), so a result genuinely matches every chip. */
export function applyTravellerFilters(
  entries: WorldEntry[],
  active: TravellerFilterId[],
  now = Date.now(),
): WorldEntry[] {
  if (!active.length) return entries;
  return entries.filter((entry) =>
    active.every((filter) => matchesTravellerFilter(entry, filter, now)),
  );
}
