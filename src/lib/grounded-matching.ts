/**
 * Grounded Matching — Phase 2 foundation
 *
 * Pure, deterministic ranking of real supply against structured intent.
 * Never invents records, pay, availability or people.
 * Works for dense cities and sparse places (village near Loch Ness,
 * remote Nepal, Byron Bay, Tokyo, etc.).
 *
 * This is the stable seam the redesign, locality pages, "I have 3 hours",
 * service search and future Journey Engine can all call.
 * It consumes only what the canonical supply engine (or fixtures) hands it.
 *
 * Architectural rules:
 * - findSupply() remains the sole possibility/discovery authority.
 * - This module only ranks and explains; it does not fetch or invent.
 * - Quiet / sparse is a valid, honest state.
 * - Evidence for every match must be explicit.
 */

import type { LayerId, WorldEntry } from "./world-data";
import type { Intent } from "./intents";

export interface MatchEvidence {
  /** Short human reason drawn only from the record itself. */
  reasons: string[];
  /** How well the record matches the requested layers / constraints (0–1). */
  strength: number;
}

export interface GroundedMatch {
  entry: WorldEntry;
  evidence: MatchEvidence;
}

export interface MatchQuery {
  /** Preferred layers (empty = any). */
  layers?: LayerId[];
  /** Prefer free activities. */
  free?: boolean;
  /** Prefer things that pay (cost < 0). */
  pays?: boolean;
  /** Prefer outdoor. */
  outdoors?: boolean;
  /** Prefer things where the user can give / contribute. */
  give?: boolean;
  /** Service category slug when known (e.g. gardening, tree-surgeon). */
  serviceCategory?: string;
  /** Soft text tokens to prefer in title/summary (never required). */
  tokens?: string[];
  /** Maximum results to return. */
  limit?: number;
}

export type MatchOutcome =
  | { kind: "matches"; matches: GroundedMatch[] }
  | { kind: "quiet"; message: string; suggestion: string };

/**
 * Rank real entries against a query. Returns only genuine matches or an
 * honest quiet outcome. Never fabricates.
 */
export function groundedMatch(entries: WorldEntry[], query: MatchQuery = {}): MatchOutcome {
  const limit = Math.max(1, Math.min(query.limit ?? 6, 12));
  const pool = entries.filter((e) => e.quality !== "expired" && !e.demonstration);

  if (pool.length === 0) {
    return {
      kind: "quiet",
      message: "Nothing current is recorded here yet.",
      suggestion:
        "Want to help make something happen? Offer a skill, post a need, or put a real event on the map.",
    };
  }

  const scored = pool
    .map((entry) => {
      const reasons: string[] = [];
      let score = 0;

      // Layer preference
      if (query.layers && query.layers.length > 0) {
        if (query.layers.includes(entry.layer)) {
          score += 20;
          reasons.push(`Matches ${entry.layer} layer`);
        } else {
          score -= 15;
        }
      }

      // Service category (when both sides declare one)
      if (query.serviceCategory && entry.serviceCategory) {
        if (entry.serviceCategory === query.serviceCategory) {
          score += 25;
          reasons.push(`Exact service: ${entry.serviceCategory}`);
        }
      }

      // Free / pays / outdoors / give. Unknown is neither free nor paid.
      if (entry.priceKnown !== false) {
        if (query.free && entry.cost === 0) {
          score += 12;
          reasons.push("Free");
        } else if (query.free && entry.cost > 0) {
          score -= 8;
        }

        if (query.pays && entry.cost < 0) {
          score += 15;
          reasons.push("Pays");
        } else if (query.pays && entry.cost >= 0) {
          score -= 10;
        }
      }

      if (query.outdoors && entry.outdoors) {
        score += 10;
        reasons.push("Outdoors");
      }

      if (query.give && entry.give) {
        score += 10;
        reasons.push("You can contribute");
      }

      // Soft token preference (title + summary only)
      if (query.tokens && query.tokens.length > 0) {
        const text = `${entry.title} ${entry.summary}`.toLowerCase();
        let tokenHits = 0;
        for (const t of query.tokens) {
          if (t && text.includes(t.toLowerCase())) tokenHits += 1;
        }
        if (tokenHits > 0) {
          score += tokenHits * 6;
          reasons.push(`Mentions ${tokenHits === 1 ? "related term" : "related terms"}`);
        }
      }

      // Quality & verification boosts
      if (entry.verified) {
        score += 5;
        reasons.push("Verified");
      }
      if (entry.quality === "recently updated" || entry.quality === "community confirmed") {
        score += 4;
      }
      if (entry.quality === "may have changed") score -= 3;

      // Prefer sooner bands lightly
      if (entry.band === "now" || entry.band === "today" || entry.band === "tonight") {
        score += 3;
      }

      const strength = Math.max(0, Math.min(1, (score + 30) / 80));
      return { entry, score, reasons, strength };
    })
    .filter((r) => r.score > -5) // drop clear mismatches
    .sort((a, b) => b.score - a.score);

  const matches: GroundedMatch[] = scored.slice(0, limit).map((r) => ({
    entry: r.entry,
    evidence: {
      reasons: r.reasons.length > 0 ? r.reasons : ["Available in this place"],
      strength: r.strength,
    },
  }));

  if (matches.length === 0) {
    return {
      kind: "quiet",
      message: "Nothing current matches what you asked for here.",
      suggestion:
        "Try a wider area, a different layer, or help make something happen by posting a need or offering a skill.",
    };
  }

  return { kind: "matches", matches };
}

/** Convenience: turn an existing Intent into a MatchQuery. */
export function queryFromIntent(intent: Intent, extra: Partial<MatchQuery> = {}): MatchQuery {
  const q: MatchQuery = {};
  if (intent.layers.length) q.layers = intent.layers;
  if (intent.free !== undefined) q.free = intent.free;
  if (intent.pays !== undefined) q.pays = intent.pays;
  if (intent.outdoors !== undefined) q.outdoors = intent.outdoors;
  if (intent.give !== undefined) q.give = intent.give;
  return { ...q, ...extra };
}

/**
 * "I have 3 hours" style helper — returns a small number of grounded matches
 * or an honest quiet outcome. Never invents.
 */
export function threeHours(
  entries: WorldEntry[],
  options: { free?: boolean; outdoors?: boolean; layers?: LayerId[] } = {},
): MatchOutcome {
  const q: MatchQuery = { limit: 4 };
  if (options.free !== undefined) q.free = options.free;
  if (options.outdoors !== undefined) q.outdoors = options.outdoors;
  if (options.layers !== undefined) q.layers = options.layers;
  return groundedMatch(entries, q);
}
