/**
 * Supply Gap classification.
 *
 * Answers one question only:
 *   "Do we currently have enough trustworthy canonical supply for this request?"
 *
 * It does NOT:
 *   - search people
 *   - score candidates
 *   - rank results
 *   - invent providers
 *   - replace or compete with findSupply()
 *
 * Pipeline:
 *   SEARCH INTENT → locality + intent → findSupply() → SupplyGap classification
 *   → SATISFIED | WEAK_SUPPLY | ZERO_SUPPLY | UNKNOWN_LOCALITY
 *   → acquisition / product action
 *
 * Permanent invariants enforced:
 *   capability ≠ availability
 *   unknown ≠ zero
 *   zero canonical results ≠ proof that no real-world provider exists
 *   residence ≠ service area
 *   journey ≠ availability
 */

import type { SupplyAnswer, SupplyBand } from "./supply-engine";

export type SupplyGapStatus = "SATISFIED" | "WEAK_SUPPLY" | "ZERO_SUPPLY" | "UNKNOWN_LOCALITY";

export interface SupplyGapInput {
  /** Result of the sole canonical discovery authority. */
  supply: SupplyAnswer;
  /** True only when the locality itself could not be resolved with confidence. */
  localityResolved: boolean;
  /** Optional soft thresholds; defaults are conservative. */
  options?: {
    /** Minimum number of non-related results before considering SATISFIED. Default 1. */
    minResults?: number;
    /** Bands that count as "strong" evidence. Default excludes "related". */
    strongBands?: SupplyBand[];
  };
}

export interface SupplyGapResult {
  status: SupplyGapStatus;
  /** Human-readable reason grounded only in the supplied evidence. */
  reason: string;
  /** How many results were considered strong. */
  strongCount: number;
  /** Total results returned by findSupply (including related). */
  totalCount: number;
  /** Whether the answer was quiet (no real possibilities). */
  quiet: boolean;
}

const DEFAULT_STRONG_BANDS: SupplyBand[] = [
  "direct",
  "local_capability",
  "open_to_opportunities",
  "community",
  "contribution",
  "skills_exchange",
  "journey",
];

/**
 * Classify the current state of canonical supply for a request.
 * Pure function. Never invents data. Never searches people.
 */
export function classifySupplyGap(input: SupplyGapInput): SupplyGapResult {
  const { supply, localityResolved } = input;
  const minResults = input.options?.minResults ?? 1;
  const strongBands = new Set(input.options?.strongBands ?? DEFAULT_STRONG_BANDS);

  if (!localityResolved) {
    return {
      status: "UNKNOWN_LOCALITY",
      reason: "Locality could not be resolved with confidence; supply cannot be classified.",
      strongCount: 0,
      totalCount: supply.results.length,
      quiet: supply.quiet,
    };
  }

  const strong = supply.results.filter((r) => strongBands.has(r.band));
  const strongCount = strong.length;
  const totalCount = supply.results.length;

  if (strongCount >= minResults) {
    return {
      status: "SATISFIED",
      reason: `Canonical discovery returned ${strongCount} strong result(s) for the resolved locality.`,
      strongCount,
      totalCount,
      quiet: supply.quiet,
    };
  }

  if (totalCount > 0) {
    return {
      status: "WEAK_SUPPLY",
      reason: `Canonical discovery returned only weak or related results (${totalCount} total, ${strongCount} strong).`,
      strongCount,
      totalCount,
      quiet: supply.quiet,
    };
  }

  // Zero results. This is NOT proof that no real-world provider exists.
  return {
    status: "ZERO_SUPPLY",
    reason:
      "Canonical discovery returned zero trustworthy results. This does not prove that no real-world provider exists; it only means Living World currently has no evidence-backed possibility to show.",
    strongCount: 0,
    totalCount: 0,
    quiet: true,
  };
}
