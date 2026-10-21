/**
 * Evidence-based indexability policy shared by rendered locality/service pages.
 *
 * The caller supplies facts from the canonical public read. This module does
 * not fetch records, invent local claims, or turn demonstration data into supply.
 */
import type { WorldEntry } from "./world-data";

export type PublicPageKind = "locality" | "service";
export type IndexabilityStatus =
  "INDEXABLE" | "INDEXABLE_WITH_LIMITATIONS" | "NOINDEX"
  | "NOT_PUBLISHED";

export type IndexabilityReason =
  | "not_published"
  | "invalid_place"
  | "invalid_category"
  | "policy_blocked"
  | "demonstration_only"
  | "invalid_record_count"
  | "no_published_records"
  | "below_record_threshold"
  | "stale_or_expired"
  | "missing_provenance"
  | "missing_internal_links"
  | "incomplete_information";

export interface IndexabilityInput {
  pageKind: PublicPageKind;
  published: boolean;
  placeValid: boolean;
  categoryValid?: boolean;
  /** Count only genuine, non-demonstration records displayed by the route. */
  publishedRecordCount: number;
  demonstrationOnly: boolean;
  informationComplete: boolean;
  recordsFresh: boolean;
  provenancePresent: boolean;
  internalLinksPresent: boolean;
  policyAllowed: boolean;
  /** Route-specific threshold. Defaults to three genuine records. */
  minimumPublishedRecords?: number;
}

export interface IndexabilityDecision {
  status: IndexabilityStatus;
  reasons: IndexabilityReason[];
  /** A deliberately strict subset of public metadata eligibility. */
  sitemapEligible: boolean;
}

function makeDecision(
  status: IndexabilityStatus,
  reasons: IndexabilityReason[],
): IndexabilityDecision {
  return { status, reasons, sitemapEligible: status === "INDEXABLE" };
}

/**
 * Decide whether the records actually rendered by a public route are suitable
 * for search. Missing, invalid, stale or policy-blocked evidence fails closed.
 */
export function evaluateIndexability(input: IndexabilityInput): IndexabilityDecision {
  if (!input.published) return makeDecision("NOT_PUBLISHED", ["not_published"]);

  const reasons: IndexabilityReason[] = [];
  if (!input.placeValid) reasons.push("invalid_place");
  if (input.pageKind === "service" && input.categoryValid !== true) {
    reasons.push("invalid_category");
  }
  if (!input.policyAllowed) reasons.push("policy_blocked");
  if (input.demonstrationOnly) reasons.push("demonstration_only");

  const count = input.publishedRecordCount;
  if (!Number.isSafeInteger(count) || count < 0) {
    reasons.push("invalid_record_count");
  } else if (count === 0) {
    reasons.push("no_published_records");
  } else {
    const requested = input.minimumPublishedRecords;
    const minimum =
      Number.isSafeInteger(requested) && (requested ?? 0) > 0 ? (requested as number) : 3;
    if (count < minimum) reasons.push("below_record_threshold");
  }

  if (!input.recordsFresh) reasons.push("stale_or_expired");
  if (!input.provenancePresent) reasons.push("missing_provenance");
  if (!input.internalLinksPresent) reasons.push("missing_internal_links");

  if (reasons.length) return makeDecision("NOINDEX", reasons);
  if (!input.informationComplete) {
    return makeDecision("INDEXABLE_WITH_LIMITATIONS", ["incomplete_information"]);
  }
  return makeDecision("INDEXABLE", []);
}

/** A record is not fresh enough for search when its explicit state says otherwise. */
export function isFreshIndexableRecord(entry: WorldEntry, now: number): boolean {
  if (
    entry.quality === "expired" ||
    entry.quality === "may have changed" ||
    Boolean(entry.cancellation)
  ) {
    return false;
  }

  const startsAt = entry.startsAt ? Date.parse(entry.startsAt) : undefined;
  const endsAt = entry.endsAt ? Date.parse(entry.endsAt) : undefined;
  if (startsAt !== undefined && !Number.isFinite(startsAt)) return false;
  if (endsAt !== undefined && !Number.isFinite(endsAt)) return false;

  // Prefer an explicit end instant; otherwise a dated record expires at start.
  const expiry = endsAt ?? startsAt;
  return expiry === undefined || expiry >= now;
}

/**
 * Residents' own posts are attributable to the posting account. Imported and
 * confirmed source records need an explicit name and safe public source URL.
 */
export function hasIndexableProvenance(entry: WorldEntry): boolean {
  if (entry.origin === "resident") return true;
  if (
    (entry.origin !== "source" && entry.origin !== "confirmed") ||
    !entry.sourceName?.trim() ||
    !entry.sourceUrl?.trim()
  ) {
    return false;
  }

  try {
    const url = new URL(entry.sourceUrl.trim());
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
