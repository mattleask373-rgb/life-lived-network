/**
 * Privacy-minimised measurement contract for the real-world outcome funnel.
 *
 * This module defines and validates event vocabulary only. It does not persist,
 * transmit, fingerprint, or instrument events. A reviewed sink, lawful purpose,
 * retention policy, access policy and human approval are separate requirements.
 *
 * Privacy by default:
 * - day-level UTC bucket, not a precise event timestamp;
 * - coarse country/locality-kind dimensions only;
 * - no raw search text, email/phone, names, account/session/connection/need IDs,
 *   coordinates, messages, URLs, arbitrary free-form reasons or vendor IDs.
 */
export const MEASUREMENT_SCHEMA_VERSION = 1 as const;

export type EntryPoint = "home" | "header" | "locality" | "direct";
export type QueryLengthBucket = "empty" | "1_3" | "4_7" | "8_15" | "16_plus";
export type LocalityKind = "country" | "region" | "county" | "city" | "town" | "village" | "neighbourhood" | "unknown";
export type ConfidenceBucket = "high" | "medium" | "low" | "unknown";
export type IntentFamily =
  | "whats_on"
  | "local_service"
  | "work"
  | "class_experience"
  | "community"
  | "journey"
  | "time_specific"
  | "help"
  | "unknown";
export type IntentCertainty = "clear" | "likely" | "unclear";
export type ResultCountBucket =
  | "zero"
  | "one"
  | "two"
  | "three_to_five"
  | "six_to_ten"
  | "eleven_plus";
export type FreshnessState = "current" | "aging" | "unknown" | "mixed";
export type QuietReason =
  | "no_verified_results"
  | "unknown_locality"
  | "stale_evidence"
  | "scope_too_wide"
  | "source_unavailable"
  | "request_failed"
  | "other";
export type SelectedAction =
  | "view_details"
  | "start_connection"
  | "create_need"
  | "save"
  | "external_action"
  | "contribute"
  | "report";
export type TargetKind = "person" | "listing" | "need" | "place" | "event" | "journey" | "service";
export type ConnectionOutcome = "accepted" | "declined" | "withdrawn" | "expired" | "unknown";
export type ContributionKind =
  | "time"
  | "skills"
  | "labour"
  | "knowledge"
  | "tools"
  | "vehicle"
  | "transport"
  | "music"
  | "creativity"
  | "translation"
  | "food"
  | "accommodation"
  | "mentoring"
  | "other";
export type UsefulOutcome =
  | "connection_accepted"
  | "service_completed"
  | "event_attended"
  | "community_joined"
  | "contribution_received"
  | "other";
export type ReportedContentKind =
  | "profile"
  | "listing"
  | "need"
  | "message"
  | "external_link"
  | "other";
export type ReportCategory =
  | "spam"
  | "impersonation"
  | "unsafe"
  | "incorrect"
  | "harassment"
  | "other";
export type ProviderResponse = "responded" | "declined" | "no_response" | "unknown";

interface MeasurementBase {
  schemaVersion: typeof MEASUREMENT_SCHEMA_VERSION;
  /** UTC calendar day, YYYY-MM-DD. No event-level timestamp. */
  dayUTC: string;
}

export interface SearchSubmittedMeasurement extends MeasurementBase {
  type: "search_submitted";
  entryPoint: EntryPoint;
  queryLength: QueryLengthBucket;
}

export interface LocalityResolvedMeasurement extends MeasurementBase {
  type: "locality_resolved";
  countryCode: string;
  localityKind: LocalityKind;
  confidence: ConfidenceBucket;
}

export interface IntentResolvedMeasurement extends MeasurementBase {
  type: "intent_resolved";
  intentFamily: IntentFamily;
  certainty: IntentCertainty;
}

export interface ResultsViewedMeasurement extends MeasurementBase {
  type: "results_viewed";
  countryCode: string;
  intentFamily: IntentFamily;
  resultCount: ResultCountBucket;
  freshness: FreshnessState;
}

export interface QuietResultMeasurement extends MeasurementBase {
  type: "quiet_result";
  countryCode: string;
  intentFamily: IntentFamily;
  reason: QuietReason;
}

export interface ActionSelectedMeasurement extends MeasurementBase {
  type: "action_selected";
  action: SelectedAction;
  targetKind: TargetKind;
}

export interface ConnectionOutcomeMeasurement extends MeasurementBase {
  type: "connection_outcome";
  outcome: ConnectionOutcome;
}

export interface ContributionCreatedMeasurement extends MeasurementBase {
  type: "contribution_created";
  countryCode: string;
  contributionKind: ContributionKind;
}

export interface ProviderResponseMeasurement extends MeasurementBase {
  type: "provider_response";
  countryCode: string;
  response: ProviderResponse;
}

export interface UsefulOutcomeMeasurement extends MeasurementBase {
  type: "useful_outcome_completed";
  countryCode: string;
  outcome: UsefulOutcome;
}

export interface ReportSubmittedMeasurement extends MeasurementBase {
  type: "report_submitted";
  contentKind: ReportedContentKind;
  category: ReportCategory;
}

export interface ReturnDiscoveryMeasurement extends MeasurementBase {
  type: "return_discovery";
  countryCode: string;
  entryPoint: EntryPoint;
}

export type MeasurementEvent =
  | SearchSubmittedMeasurement
  | LocalityResolvedMeasurement
  | IntentResolvedMeasurement
  | ResultsViewedMeasurement
  | QuietResultMeasurement
  | ActionSelectedMeasurement
  | ConnectionOutcomeMeasurement
  | ContributionCreatedMeasurement
  | ProviderResponseMeasurement
  | UsefulOutcomeMeasurement
  | ReportSubmittedMeasurement
  | ReturnDiscoveryMeasurement;

const VALUES = {
  entryPoint: ["home", "header", "locality", "direct"],
  queryLength: ["empty", "1_3", "4_7", "8_15", "16_plus"],
  localityKind: [
    "country",
    "region",
    "county",
    "city",
    "town",
    "village",
    "neighbourhood",
    "unknown",
  ],
  confidence: ["high", "medium", "low", "unknown"],
  intentFamily: [
    "whats_on",
    "local_service",
    "work",
    "class_experience",
    "community",
    "journey",
    "time_specific",
    "help",
    "unknown",
  ],
  certainty: ["clear", "likely", "unclear"],
  resultCount: ["zero", "one", "two", "three_to_five", "six_to_ten", "eleven_plus"],
  freshness: ["current", "aging", "unknown", "mixed"],
  quietReason: [
    "no_verified_results",
    "unknown_locality",
    "stale_evidence",
    "scope_too_wide",
    "source_unavailable",
    "request_failed",
    "other",
  ],
  action: [
    "view_details",
    "start_connection",
    "create_need",
    "save",
    "external_action",
    "contribute",
    "report",
  ],
  targetKind: ["person", "listing", "need", "place", "event", "journey", "service"],
  connectionOutcome: ["accepted", "declined", "withdrawn", "expired", "unknown"],
  contributionKind: [
    "time",
    "skills",
    "labour",
    "knowledge",
    "tools",
    "vehicle",
    "transport",
    "music",
    "creativity",
    "translation",
    "food",
    "accommodation",
    "mentoring",
    "other",
  ],
  usefulOutcome: [
    "connection_accepted",
    "service_completed",
    "event_attended",
    "community_joined",
    "contribution_received",
    "other",
  ],
  contentKind: ["profile", "listing", "need", "message", "external_link", "other"],
  reportCategory: ["spam", "impersonation", "unsafe", "incorrect", "harassment", "other"],
  providerResponse: ["responded", "declined", "no_response", "unknown"],
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertExactKeys(record: Record<string, unknown>, allowed: readonly string[]): void {
  const allow = new Set(allowed);
  const extra = Object.keys(record).filter((key) => !allow.has(key));
  if (extra.length) {
    throw new Error("Measurement event contains unsupported fields.");
  }
}

function assertEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): asserts value is T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`Measurement event has an invalid ${field}.`);
  }
}

function assertCountryCode(value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^[A-Z]{2}$/.test(value)) {
    throw new Error("Measurement event countryCode must be a two-letter uppercase code.");
  }
}

function assertDayUTC(value: unknown): asserts value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) ||
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value
  ) {
    throw new Error("Measurement event dayUTC must be a valid YYYY-MM-DD date.");
  }
}

/**
 * Validate and whitelist one event before it reaches any future sink.
 * Extra fields are rejected, not forwarded, to prevent accidental collection
 * of raw queries, identity keys, message content, URLs, coordinates or secrets.
 */
export function parseMeasurementEvent(input: unknown): MeasurementEvent {
  if (!isRecord(input)) throw new Error("Measurement event must be an object.");

  const base = ["schemaVersion", "dayUTC", "type"];
  if (input.schemaVersion !== MEASUREMENT_SCHEMA_VERSION) {
    throw new Error("Measurement event schemaVersion is unsupported.");
  }
  assertDayUTC(input.dayUTC);

  switch (input.type) {
    case "search_submitted":
      assertExactKeys(input, [...base, "entryPoint", "queryLength"]);
      assertEnum(input.entryPoint, VALUES.entryPoint, "entryPoint");
      assertEnum(input.queryLength, VALUES.queryLength, "queryLength");
      return {
        schemaVersion: 1,
        dayUTC: input.dayUTC,
        type: input.type,
        entryPoint: input.entryPoint,
        queryLength: input.queryLength,
      };
    case "locality_resolved":
      assertExactKeys(input, [...base, "countryCode", "localityKind", "confidence"]);
      assertCountryCode(input.countryCode);
      assertEnum(input.localityKind, VALUES.localityKind, "localityKind");
      assertEnum(input.confidence, VALUES.confidence, "confidence");
      return {
        schemaVersion: 1,
        dayUTC: input.dayUTC,
        type: input.type,
        countryCode: input.countryCode,
        localityKind: input.localityKind,
        confidence: input.confidence,
      };
    case "intent_resolved":
      assertExactKeys(input, [...base, "intentFamily", "certainty"]);
      assertEnum(input.intentFamily, VALUES.intentFamily, "intentFamily");
      assertEnum(input.certainty, VALUES.certainty, "certainty");
      return {
        schemaVersion: 1,
        dayUTC: input.dayUTC,
        type: input.type,
        intentFamily: input.intentFamily,
        certainty: input.certainty,
      };
    case "results_viewed":
      assertExactKeys(input, [...base, "countryCode", "intentFamily", "resultCount", "freshness"]);
      assertCountryCode(input.countryCode);
      assertEnum(input.intentFamily, VALUES.intentFamily, "intentFamily");
      assertEnum(input.resultCount, VALUES.resultCount, "resultCount");
      assertEnum(input.freshness, VALUES.freshness, "freshness");
      return {
        schemaVersion: 1,
        dayUTC: input.dayUTC,
        type: input.type,
        countryCode: input.countryCode,
        intentFamily: input.intentFamily,
        resultCount: input.resultCount,
        freshness: input.freshness,
      };
    case "quiet_result":
      assertExactKeys(input, [...base, "countryCode", "intentFamily", "reason"]);
      assertCountryCode(input.countryCode);
      assertEnum(input.intentFamily, VALUES.intentFamily, "intentFamily");
      assertEnum(input.reason, VALUES.quietReason, "reason");
      return {
        schemaVersion: 1,
        dayUTC: input.dayUTC,
        type: input.type,
        countryCode: input.countryCode,
        intentFamily: input.intentFamily,
        reason: input.reason,
      };
    case "action_selected":
      assertExactKeys(input, [...base, "action", "targetKind"]);
      assertEnum(input.action, VALUES.action, "action");
      assertEnum(input.targetKind, VALUES.targetKind, "targetKind");
      return {
        schemaVersion: 1,
        dayUTC: input.dayUTC,
        type: input.type,
        action: input.action,
        targetKind: input.targetKind,
      };
    case "connection_outcome":
      assertExactKeys(input, [...base, "outcome"]);
      assertEnum(input.outcome, VALUES.connectionOutcome, "outcome");
      return {
        schemaVersion: 1,
        dayUTC: input.dayUTC,
        type: input.type,
        outcome: input.outcome,
      };
    case "contribution_created":
      assertExactKeys(input, [...base, "countryCode", "contributionKind"]);
      assertCountryCode(input.countryCode);
      assertEnum(input.contributionKind, VALUES.contributionKind, "contributionKind");
      return {
        schemaVersion: 1,
        dayUTC: input.dayUTC,
        type: input.type,
        countryCode: input.countryCode,
        contributionKind: input.contributionKind,
      };
    case "provider_response":
      assertExactKeys(input, [...base, "countryCode", "response"]);
      assertCountryCode(input.countryCode);
      assertEnum(input.response, VALUES.providerResponse, "response");
      return {
        schemaVersion: 1,
        dayUTC: input.dayUTC,
        type: input.type,
        countryCode: input.countryCode,
        response: input.response,
      };
    case "useful_outcome_completed":
      assertExactKeys(input, [...base, "countryCode", "outcome"]);
      assertCountryCode(input.countryCode);
      assertEnum(input.outcome, VALUES.usefulOutcome, "outcome");
      return {
        schemaVersion: 1,
        dayUTC: input.dayUTC,
        type: input.type,
        countryCode: input.countryCode,
        outcome: input.outcome,
      };
    case "report_submitted":
      assertExactKeys(input, [...base, "contentKind", "category"]);
      assertEnum(input.contentKind, VALUES.contentKind, "contentKind");
      assertEnum(input.category, VALUES.reportCategory, "category");
      return {
        schemaVersion: 1,
        dayUTC: input.dayUTC,
        type: input.type,
        contentKind: input.contentKind,
        category: input.category,
      };
    case "return_discovery":
      assertExactKeys(input, [...base, "countryCode", "entryPoint"]);
      assertCountryCode(input.countryCode);
      assertEnum(input.entryPoint, VALUES.entryPoint, "entryPoint");
      return {
        schemaVersion: 1,
        dayUTC: input.dayUTC,
        type: input.type,
        countryCode: input.countryCode,
        entryPoint: input.entryPoint,
      };
    default:
      throw new Error("Measurement event type is unsupported.");
  }
}
