/**
 * Deciding when two records are the same event.
 *
 * Deterministic and explainable, on purpose. Where the evidence falls short we
 * keep both records rather than quietly merging two different nights out. There
 * is no confidence score and no model judgement anywhere in this file.
 */

import type { SourceEvent } from "./contract";

/** Minutes two start times may differ by and still be the same event. */
export const START_TOLERANCE_MINUTES = 60;

const NOISE = new Set([
  "the",
  "a",
  "an",
  "at",
  "in",
  "on",
  "of",
  "and",
  "with",
  "live",
  "presents",
  "tickets",
  "event",
]);

/** Titles compared as words, not characters: casing and punctuation are noise. */
export function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !NOISE.has(word))
    .sort()
    .join(" ");
}

export function placeKey(event: { venueName: string }): string {
  return event.venueName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 40);
}

export interface MatchDecision {
  same: boolean;
  /** Plain words, so a person can always see why. */
  reason: string;
}

/**
 * The same event from two different sources?
 *
 * All three must hold: start times within tolerance, the same resolved place,
 * and titles that agree. Two out of three is not enough.
 */
export function sameEvent(
  a: SourceEvent & { placeId?: string | null },
  b: SourceEvent & { placeId?: string | null },
): MatchDecision {
  const apart = Math.abs(new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()) / 60000;
  if (!Number.isFinite(apart) || apart > START_TOLERANCE_MINUTES) {
    return { same: false, reason: "Start times are too far apart" };
  }

  const samePlace =
    a.placeId && b.placeId
      ? a.placeId === b.placeId
      : placeKey(a) !== "" && placeKey(a) === placeKey(b);
  if (!samePlace) return { same: false, reason: "Different venue or locality" };

  const keyA = titleKey(a.title);
  const keyB = titleKey(b.title);
  if (!keyA || !keyB) return { same: false, reason: "Not enough of a title to compare" };
  if (keyA === keyB) {
    return { same: true, reason: "Same time, same place, same title" };
  }

  const wordsA = new Set(keyA.split(" "));
  const wordsB = new Set(keyB.split(" "));
  const shared = [...wordsA].filter((word) => wordsB.has(word)).length;
  const smaller = Math.min(wordsA.size, wordsB.size);
  if (smaller >= 2 && shared / smaller >= 0.8) {
    return { same: true, reason: "Same time, same place, titles agree" };
  }
  return { same: false, reason: "Titles do not agree closely enough" };
}

/** Within one source, its own identifier is the truth. */
export function sameSourceRecord(
  a: { sourceId: string; externalId: string },
  b: { sourceId: string; externalId: string },
): boolean {
  return a.sourceId === b.sourceId && a.externalId === b.externalId;
}

/**
 * A stable fingerprint of a payload, so an unchanged record is recognised
 * without rewriting it. Deliberately cheap and deterministic.
 */
export function payloadHash(value: unknown): string {
  const text = JSON.stringify(value) ?? "";
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    h1 = ((h1 ^ code) * 16777619) >>> 0;
    h2 = (h2 + code * (i + 1)) >>> 0;
  }
  return `${h1.toString(16)}${h2.toString(16)}`;
}
