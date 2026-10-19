/**
 * Proposed Australia pilot hierarchy only. This is intentionally not an import
 * payload: source records, licensing, coordinates and country-level timezone
 * semantics have not been reviewed. Do not feed this module to a publish path.
 */
export interface AustraliaStagingDraft {
  sourceKey: string;
  name: string;
  slug: string;
  kind: "country" | "region" | "area" | "city" | "town" | "village" | "neighbourhood";
  /** Proposed parent only; local government/administrative crosswalk still needs review. */
  parentSourceKey: string | null;
  countryCode: "AU";
  currency: "AUD";
  /** Candidate from local geography only; null when country-level meaning is unresolved. */
  timezoneCandidate: string | null;
  timezoneDecisionRequired: "candidate_pending_review" | "country_semantics_unresolved";
  latitude: null;
  longitude: null;
  blurb: "";
  sourceDataStatus: "unknown" | "unconfirmed";
  publicationStatus: "not_published";
  hierarchyDecision: "proposed_not_approved";
  source: {
    sourceKey: string;
    sourceName: "OFFICIAL SOURCE REVIEW PENDING";
    sourceUrlCandidate: string;
    licenseName: null;
    licenseUrlCandidate: null;
    attribution: null;
    version: null;
    retrievedAt: null;
    reviewStatus: "pending";
    rightsStatus: "unreviewed";
  };
}

const SOURCE_CANDIDATES = {
  australia:
    "https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-4-july-2026-june-2031/access-and-downloads/digital-boundary-files",
  nsw:
    "https://www.nsw.gov.au/environment-land-and-water/spatial-data-and-mapping/foundation-spatial-data-framework/place-names",
  queensland: "https://www.data.qld.gov.au/dataset/place-names-gazetteer-queensland-txt-file/resource/414391b9-7943-4fc3-a237-a1ac57b75aab",
} as const;

function draft(
  row: Omit<
    AustraliaStagingDraft,
    | "countryCode"
    | "currency"
    | "latitude"
    | "longitude"
    | "blurb"
    | "publicationStatus"
    | "hierarchyDecision"
    | "source"
  > & { sourceUrlCandidate: string },
): AustraliaStagingDraft {
  return {
    sourceKey: row.sourceKey,
    name: row.name,
    slug: row.slug,
    kind: row.kind,
    parentSourceKey: row.parentSourceKey,
    countryCode: "AU",
    currency: "AUD",
    timezoneCandidate: row.timezoneCandidate,
    timezoneDecisionRequired: row.timezoneDecisionRequired,
    latitude: null,
    longitude: null,
    blurb: "",
    sourceDataStatus: row.sourceDataStatus,
    publicationStatus: "not_published",
    hierarchyDecision: "proposed_not_approved",
    source: {
      sourceKey: row.sourceKey,
      sourceName: "OFFICIAL SOURCE REVIEW PENDING",
      sourceUrlCandidate: row.sourceUrlCandidate,
      licenseName: null,
      licenseUrlCandidate: null,
      attribution: null,
      version: null,
      retrievedAt: null,
      reviewStatus: "pending",
      rightsStatus: "unreviewed",
    },
  };
}

/**
 * Initial parent crosswalk is deliberately coarse and unapproved:
 * Australia -> state -> pilot locality. Replace state-level parent links only
 * after the named authority supplies and a human approves the required parent.
 */
export const AUSTRALIA_STAGING_SKELETON: readonly AustraliaStagingDraft[] = [
  draft({
    sourceKey: "au:country:australia",
    name: "Australia",
    slug: "australia",
    kind: "country",
    parentSourceKey: null,
    timezoneCandidate: null,
    timezoneDecisionRequired: "country_semantics_unresolved",
    sourceDataStatus: "unknown",
    sourceUrlCandidate: SOURCE_CANDIDATES.australia,
  }),
  draft({
    sourceKey: "au:region:new-south-wales",
    name: "New South Wales",
    slug: "new-south-wales",
    kind: "region",
    parentSourceKey: "au:country:australia",
    timezoneCandidate: "Australia/Sydney",
    timezoneDecisionRequired: "candidate_pending_review",
    sourceDataStatus: "unconfirmed",
    sourceUrlCandidate: SOURCE_CANDIDATES.nsw,
  }),
  draft({
    sourceKey: "au:region:queensland",
    name: "Queensland",
    slug: "queensland",
    kind: "region",
    parentSourceKey: "au:country:australia",
    timezoneCandidate: "Australia/Brisbane",
    timezoneDecisionRequired: "candidate_pending_review",
    sourceDataStatus: "unconfirmed",
    sourceUrlCandidate: SOURCE_CANDIDATES.queensland,
  }),
  draft({
    sourceKey: "au:locality:byron-bay",
    name: "Byron Bay",
    slug: "byron-bay",
    kind: "town",
    parentSourceKey: "au:region:new-south-wales",
    timezoneCandidate: "Australia/Sydney",
    timezoneDecisionRequired: "candidate_pending_review",
    sourceDataStatus: "unconfirmed",
    sourceUrlCandidate: SOURCE_CANDIDATES.nsw,
  }),
  draft({
    sourceKey: "au:locality:agnes-water",
    name: "Agnes Water",
    slug: "agnes-water",
    kind: "town",
    parentSourceKey: "au:region:queensland",
    timezoneCandidate: "Australia/Brisbane",
    timezoneDecisionRequired: "candidate_pending_review",
    sourceDataStatus: "unconfirmed",
    sourceUrlCandidate: SOURCE_CANDIDATES.queensland,
  }),
  draft({
    sourceKey: "au:locality:port-douglas",
    name: "Port Douglas",
    slug: "port-douglas",
    kind: "town",
    parentSourceKey: "au:region:queensland",
    timezoneCandidate: "Australia/Brisbane",
    timezoneDecisionRequired: "candidate_pending_review",
    sourceDataStatus: "unconfirmed",
    sourceUrlCandidate: SOURCE_CANDIDATES.queensland,
  }),
];
