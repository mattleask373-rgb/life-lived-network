/**
 * Pure, explainable publication gate for public SEO surfaces.
 *
 * Callers supply facts from canonical, public data reads. This module never
 * fetches data, infers local supply, or treats demonstration records as real
 * inventory. Only INDEXABLE pages may enter public sitemaps.
 */
export type PublicPageKind = "locality" | "service" | "provider" | "event";

export type IndexabilityStatus =
  "INDEXABLE" | "INDEXABLE_WITH_LIMITATIONS" | "NOINDEX" | "NOT_PUBLISHED";

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
  /** Required for service pages; not applicable to locality pages. */
  categoryValid?: boolean;
  /** Count only genuinely published, non-demonstration records. */
  publishedRecordCount: number;
  /** True when all displayed records are demonstrations and none are real. */
  demonstrationOnly: boolean;
  informationComplete: boolean;
  /** False when displayed real records include stale, expired, or cancelled facts. */
  recordsFresh: boolean;
  /** Provenance must be explicit for every record represented as real. */
  provenancePresent: boolean;
  /** True only when useful links into the existing public site are present. */
  internalLinksPresent: boolean;
  /** Caller-owned moderation, privacy, consent, and publication policy result. */
  policyAllowed: boolean;
  /** Optional stricter threshold; defaults to three real records. */
  minimumPublishedRecords?: number;
}

export interface IndexabilityDecision {
  status: IndexabilityStatus;
  reasons: IndexabilityReason[];
  /** Deliberately stricter than metadata: limited pages never enter a sitemap. */
  sitemapEligible: boolean;
}

const DEFAULT_MINIMUM_PUBLISHED_RECORDS = 3;

function decision(status: IndexabilityStatus, reasons: IndexabilityReason[]): IndexabilityDecision {
  return {
    status,
    reasons,
    sitemapEligible: status === "INDEXABLE",
  };
}

/**
 * Decide whether a page is safe and useful enough for search.
 *
 * Hard blockers fail closed to NOINDEX. Missing publication is distinct from
 * a published-but-not-indexable page. Incomplete but otherwise eligible pages
 * can be labelled INDEXABLE_WITH_LIMITATIONS, but are still kept out of
 * sitemaps until the missing information is supplied.
 */
export function evaluateIndexability(input: IndexabilityInput): IndexabilityDecision {
  if (!input.published) return decision("NOT_PUBLISHED", ["not_published"]);

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
    const requestedMinimum = input.minimumPublishedRecords;
    const minimum =
      Number.isSafeInteger(requestedMinimum) && (requestedMinimum ?? 0) > 0
        ? (requestedMinimum as number)
        : DEFAULT_MINIMUM_PUBLISHED_RECORDS;
    if (count < minimum) reasons.push("below_record_threshold");
  }

  if (!input.recordsFresh) reasons.push("stale_or_expired");
  if (!input.provenancePresent) reasons.push("missing_provenance");
  if (!input.internalLinksPresent) reasons.push("missing_internal_links");

  if (reasons.length) return decision("NOINDEX", reasons);
  if (!input.informationComplete) {
    return decision("INDEXABLE_WITH_LIMITATIONS", ["incomplete_information"]);
  }
  return decision("INDEXABLE", []);
}
