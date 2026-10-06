/**
 * Acquisition Opportunity contract.
 *
 * Turns a verified SupplyGap classification into a legitimate, evidence-driven
 * provider-acquisition opportunity.
 *
 * This module does NOT:
 *   - invent providers
 *   - invent demand or search volume
 *   - invent service areas, willingness, or availability
 *   - replace or compete with findSupply()
 *   - perform outreach
 *   - create mass SEO pages
 *
 * Pipeline:
 *   SEARCH → LOCAL INTENT → findSupply() → classifySupplyGap()
 *   → AcquisitionOpportunity (this contract)
 *   → PROVIDER CLAIM / ONBOARD (human-gated)
 *   → CAPABILITY + WILLINGNESS + SERVICE AREA + EVIDENCE
 *   → TRUSTED POSSIBILITY → CONNECTION → REAL LIFE
 *
 * Permanent invariants:
 *   capability ≠ willingness
 *   capability ≠ availability
 *   residence ≠ service area
 *   journey ≠ availability
 *   unknown ≠ yes / no
 *   ZERO_SUPPLY ≠ proof of real-world absence
 */

import type { SupplyGapResult, SupplyGapStatus } from "./supply-gap";

/** High-frequency local-service categories used for the initial wedge. */
export type AcquisitionCategory =
  | "gardener"
  | "plumber"
  | "electrician"
  | "cleaner"
  | "handyman"
  | "other_local_service";

export type AcquisitionPriority = "high" | "medium" | "low" | "none";

/**
 * A pure, evidence-driven acquisition opportunity.
 * Never contains invented people, reviews, demand numbers, or availability.
 */
export interface AcquisitionOpportunity {
  /** Stable key for this opportunity surface (locality + category). */
  id: string;
  /** Canonical locality identifier (never inferred). */
  localityId: string;
  /** Human-readable locality name for display only. */
  localityName: string;
  /** Service category that produced the gap. */
  category: AcquisitionCategory;
  /** Subject string from the original search intent (e.g. "gardener"). */
  subject: string;
  /** The gap classification that justified this opportunity. */
  gapStatus: SupplyGapStatus;
  /** Human-readable reason grounded only in the gap evidence. */
  reason: string;
  /** Priority derived solely from gap status. */
  priority: AcquisitionPriority;
  /** Whether the gap is actionable for acquisition (ZERO or WEAK only). */
  actionable: boolean;
  /**
   * Explicit unknowns that a provider claim must address.
   * These remain unknown until a real person supplies evidence.
   */
  requiredEvidence: readonly string[];
  /**
   * Measurement-safe event payload. No PII, no precise coordinates,
   * no private contact data.
   */
  measurement: {
    type: "acquisition_opportunity_surfaced";
    localityId: string;
    category: AcquisitionCategory;
    gapStatus: SupplyGapStatus;
    timestamp: string;
  };
}

export interface AcquisitionOpportunityInput {
  /** Result of classifySupplyGap(). */
  gap: SupplyGapResult;
  /** Canonical locality that was resolved. */
  localityId: string;
  localityName: string;
  /** Subject from search intent (e.g. "gardener"). */
  subject: string;
  /** Optional category override; otherwise derived from subject. */
  category?: AcquisitionCategory;
  /** Clock for deterministic measurement timestamps. */
  now?: string | Date;
}

const CATEGORY_FROM_SUBJECT: Record<string, AcquisitionCategory> = {
  gardener: "gardener",
  gardening: "gardener",
  garden: "gardener",
  plumber: "plumber",
  plumbing: "plumber",
  electrician: "electrician",
  electrical: "electrician",
  cleaner: "cleaner",
  cleaning: "cleaner",
  handyman: "handyman",
  "handyman services": "handyman",
};

/**
 * Derive a conservative category from the search subject.
 * Unknown subjects become "other_local_service". Never invents a specialty.
 */
export function categoryFromSubject(subject: string): AcquisitionCategory {
  const key = subject.trim().toLowerCase();
  return CATEGORY_FROM_SUBJECT[key] ?? "other_local_service";
}

/**
 * Priority is derived solely from the gap status.
 * SATISFIED and UNKNOWN_LOCALITY produce no actionable opportunity.
 */
export function priorityFromGap(status: SupplyGapStatus): AcquisitionPriority {
  switch (status) {
    case "ZERO_SUPPLY":
      return "high";
    case "WEAK_SUPPLY":
      return "medium";
    case "SATISFIED":
    case "UNKNOWN_LOCALITY":
      return "none";
  }
}

/**
 * Evidence a provider must supply before the opportunity can become a
 * trusted possibility. These are always listed as unknowns; the contract
 * never claims they already exist.
 */
const REQUIRED_EVIDENCE: readonly string[] = [
  "capability statement (what the person can do)",
  "willingness to be found for this kind of work",
  "service area (distinct from residence)",
  "availability windows or explicit 'availability unknown'",
  "verification status of any regulated claims",
];

/**
 * Pure transformation: SupplyGap → AcquisitionOpportunity.
 * Returns null when the gap is not actionable (SATISFIED or UNKNOWN_LOCALITY).
 * Never invents providers, demand, or inventory.
 */
export function toAcquisitionOpportunity(
  input: AcquisitionOpportunityInput,
): AcquisitionOpportunity | null {
  const { gap, localityId, localityName, subject } = input;
  const category = input.category ?? categoryFromSubject(subject);
  const priority = priorityFromGap(gap.status);

  if (priority === "none") {
    return null;
  }

  const now = input.now
    ? typeof input.now === "string"
      ? input.now
      : input.now.toISOString()
    : new Date().toISOString();

  const id = `acq:${localityId}:${category}`;

  return {
    id,
    localityId,
    localityName,
    category,
    subject: subject.trim() || category,
    gapStatus: gap.status,
    reason: gap.reason,
    priority,
    actionable: true,
    requiredEvidence: REQUIRED_EVIDENCE,
    measurement: {
      type: "acquisition_opportunity_surfaced",
      localityId,
      category,
      gapStatus: gap.status,
      timestamp: now,
    },
  };
}
