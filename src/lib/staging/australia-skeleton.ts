/**
 * Proposed Australia pilot hierarchy only. This is intentionally not an import
 * payload: two Queensland gazetteer points are filled as source-backed candidates;
 * NSW coordinates and several provenance fields remain incomplete. Human rights,
 * hierarchy, CRS and timezone decisions are pending. Never feed to a publish path.
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
  /** Official gazetteer place-point candidate, not a navigation or address coordinate. */
  latitude: number | null;
  longitude: number | null;
  blurb: "";
  sourceDataStatus: "unknown" | "unconfirmed";
  publicationStatus: "not_published";
  hierarchyDecision: "proposed_not_approved";
  source: {
    sourceKey: string;
    sourceName: string;
    sourceUrlCandidate: string;
    licenseName: string | null;
    licenseUrlCandidate: string | null;
    attribution: string | null;
    version: null;
    retrievedAt: null;
    reviewStatus: "pending";
    rightsStatus: "unreviewed";
  };
}

const SOURCE_CANDIDATES = {
  australia:
    "https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-4-july-2026-june-2031/access-and-downloads/digital-boundary-files",
  nsw: "https://www.nsw.gov.au/environment-land-and-water/spatial-data-and-mapping/foundation-spatial-data-framework/place-names",
  queensland:
    "https://www.data.qld.gov.au/dataset/place-names-gazetteer-queensland-txt-file/resource/414391b9-7943-4fc3-a237-a1ac57b75aab",
} as const;

function draft(
  row: Omit<
    AustraliaStagingDraft,
    "countryCode" | "currency" | "blurb" | "publicationStatus" | "hierarchyDecision" | "source"
  > & {
    sourceUrlCandidate: string;
    sourceName?: string;
    licenseName?: string | null;
    licenseUrlCandidate?: string | null;
    attribution?: string | null;
    version?: string | null;
    retrievedAt?: string | null;
  },
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
    latitude: row.latitude,
    longitude: row.longitude,
    blurb: "",
    sourceDataStatus: row.sourceDataStatus,
    publicationStatus: "not_published",
    hierarchyDecision: "proposed_not_approved",
    source: {
      sourceKey: row.sourceKey,
      sourceName: row.sourceName ?? "OFFICIAL SOURCE REVIEW PENDING",
      sourceUrlCandidate: row.sourceUrlCandidate,
      licenseName: row.licenseName ?? null,
      licenseUrlCandidate: row.licenseUrlCandidate ?? null,
      attribution: row.attribution ?? null,
      version: row.version ?? null,
      retrievedAt: row.retrievedAt ?? null,
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
    latitude: null,
    longitude: null,
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
    latitude: null,
    longitude: null,
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
    latitude: null,
    longitude: null,
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
    latitude: null,
    longitude: null,
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
    latitude: -24.2125857,
    longitude: 151.90327882,
    sourceUrlCandidate: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/Location/QldPlaceNames/MapServer/0/query?where=REF_NO%3D39140&outFields=REF_NO%2CPLACE_NAME%2CDESCRIPTION%2CSTATUS%2CCURRENCY%2CMODIFIED_DATE%2CLGA_NAME%2CLONGITUDE_DD%2CLATITUDE_DD&returnGeometry=false&f=pjson",
    sourceName: "Queensland Government Department of Resources",
    licenseName: "Creative Commons Attribution 4.0 International",
    licenseUrlCandidate: "https://creativecommons.org/licenses/by/4.0/",
    attribution:
      "© State of Queensland (Department of Resources) 2024",
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
    latitude: -16.49944,
    longitude: 145.46083,
    sourceUrlCandidate: "https://spatial-gis.information.qld.gov.au/arcgis/rest/services/Location/QldPlaceNames/MapServer/0/query?where=REF_NO%3D48847&outFields=REF_NO%2CPLACE_NAME%2CDESCRIPTION%2CSTATUS%2CCURRENCY%2CMODIFIED_DATE%2CLGA_NAME%2CLONGITUDE_DD%2CLATITUDE_DD&returnGeometry=false&f=pjson",
    sourceName: "Queensland Government Department of Resources",
    licenseName: "Creative Commons Attribution 4.0 International",
    licenseUrlCandidate: "https://creativecommons.org/licenses/by/4.0/",
    attribution:
      "© State of Queensland (Department of Resources) 2024",
  }),
];
