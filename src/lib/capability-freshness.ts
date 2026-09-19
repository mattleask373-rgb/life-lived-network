/**
 * Freshness.
 *
 * Someone said something true once. That is not the same as it being true now.
 * Nothing here guesses: it reports how old a statement is, in plain words, and
 * "unknown" stays unknown rather than becoming "fine".
 */

export type FreshnessState = "fresh" | "may_have_changed" | "out_of_date" | "unknown";

export type StatementKind = "capability" | "availability" | "need";

/** Days after which a statement stops being treated as current. */
const WINDOWS: Record<StatementKind, { fresh: number; stale: number }> = {
  // What you can do changes slowly.
  capability: { fresh: 180, stale: 365 },
  // When you're free changes constantly.
  availability: { fresh: 7, stale: 30 },
  // A need usually stops mattering fairly quickly.
  need: { fresh: 14, stale: 60 },
};

const DAY = 86_400_000;

export interface FreshnessInput {
  lastConfirmedAt?: string | null;
  /** A hard end, if the person gave one. Past means out of date, full stop. */
  expiresAt?: string | null;
  kind: StatementKind;
  now: string | number | Date;
}

export function freshness(input: FreshnessInput): FreshnessState {
  const now = new Date(input.now).getTime();
  if (input.expiresAt) {
    const ends = Date.parse(input.expiresAt);
    if (Number.isFinite(ends) && ends < now) return "out_of_date";
  }
  if (!input.lastConfirmedAt) return "unknown";
  const said = Date.parse(input.lastConfirmedAt);
  if (!Number.isFinite(said)) return "unknown";
  const ageDays = (now - said) / DAY;
  const window = WINDOWS[input.kind];
  if (ageDays <= window.fresh) return "fresh";
  if (ageDays <= window.stale) return "may_have_changed";
  return "out_of_date";
}

export const FRESHNESS_LABEL: Record<FreshnessState, string> = {
  fresh: "Recently confirmed",
  may_have_changed: "May have changed",
  out_of_date: "Out of date — worth asking",
  unknown: "Not known when this was last true",
};

/** Whether a statement is current enough to put in front of someone. */
export function isCurrent(state: FreshnessState): boolean {
  return state === "fresh" || state === "may_have_changed";
}
