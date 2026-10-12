/**
 * Provider-neutral, privacy-safe product measurement contract.
 *
 * This module defines and validates an event vocabulary only. It does not
 * dispatch, persist, or transmit events. Instrumentation and retention require
 * a separate reviewed implementation.
 *
 * Privacy boundary:
 * - no raw search text, subject text, notes, contact data, or free-form strings;
 * - no user, recipient, need, listing, connection, or target IDs;
 * - no durable session ID, fingerprint, exact location, or external tracker;
 * - all event payloads have a closed field set and bounded enum values.
 */

export const MEASUREMENT_SCHEMA_VERSION = 1 as const;

export const MEASUREMENT_EVENT_TYPES = [
  "search_submitted",
  "locality_resolved",
  "intent_resolved",
  "discovery_result",
  "quiet_result",
  "action_selected",
  "connection_started",
  "connection_status_changed",
  "contribution_created",
  "return_discovery",
] as const;

export type MeasurementEventType = (typeof MEASUREMENT_EVENT_TYPES)[number];

export const MEASUREMENT_SOURCES = ["front_door", "header", "direct_url"] as const;
export const INPUT_LENGTH_BUCKETS = ["empty", "1_20", "21_60", "61_200", "over_200"] as const;
export const LOCALITY_OUTCOMES = ["resolved", "ambiguous", "unresolved"] as const;
export const PLACE_KIND_BUCKETS = [
  "neighbourhood",
  "village",
  "town",
  "city",
  "county",
  "region",
  "country",
  "unknown",
] as const;
export const INTENT_FAMILIES = [
  "need",
  "help",
  "give",
  "journey",
  "local_service",
  "whats_on",
  "community",
  "work",
  "class_experience",
  "unknown",
] as const;
export const CERTAINTIES = ["clear", "likely", "unclear"] as const;
export const MEASUREMENT_SURFACES = [
  "home",
  "locality",
  "need",
  "help",
  "give",
  "journey",
  "conversation",
] as const;
export const RESULT_COUNT_BUCKETS = ["zero", "one", "two_to_five", "six_plus"] as const;
export const DATA_STATES = ["results", "quiet", "checking", "unavailable"] as const;
export const FRESHNESS_STATES = ["fresh", "stale", "unknown"] as const;
export const QUIET_REASONS = [
  "nothing_recorded",
  "no_text_matches",
  "filtered_to_none",
  "no_eligible_supply",
  "read_unavailable",
  "unknown",
] as const;
export const MEASUREMENT_ACTIONS = [
  "view_detail",
  "save",
  "ask_for_help",
  "offer_help",
  "give_hour",
  "join_project",
  "plan_journey",
  "start_connection",
  "external_link",
] as const;
export const CONNECTION_DIRECTIONS = ["offer", "invite"] as const;
export const CONNECTION_STATUSES = ["accepted", "declined", "withdrawn"] as const;
export const CONTRIBUTION_KINDS = ["capability", "listing", "need", "hour", "journey"] as const;

export interface MeasurementEventBase {
  schemaVersion: typeof MEASUREMENT_SCHEMA_VERSION;
  occurredAt: string;
}

export interface SearchSubmittedEvent extends MeasurementEventBase {
  type: "search_submitted";
  source: (typeof MEASUREMENT_SOURCES)[number];
  inputLength: (typeof INPUT_LENGTH_BUCKETS)[number];
}

export interface LocalityResolvedEvent extends MeasurementEventBase {
  type: "locality_resolved";
  outcome: (typeof LOCALITY_OUTCOMES)[number];
  placeKind: (typeof PLACE_KIND_BUCKETS)[number];
}

export interface IntentResolvedEvent extends MeasurementEventBase {
  type: "intent_resolved";
  intentFamily: (typeof INTENT_FAMILIES)[number];
  certainty: (typeof CERTAINTIES)[number];
}

export interface DiscoveryResultEvent extends MeasurementEventBase {
  type: "discovery_result";
  surface: (typeof MEASUREMENT_SURFACES)[number];
  resultCount: (typeof RESULT_COUNT_BUCKETS)[number];
  dataState: (typeof DATA_STATES)[number];
  freshness: (typeof FRESHNESS_STATES)[number];
}

export interface QuietResultEvent extends MeasurementEventBase {
  type: "quiet_result";
  surface: (typeof MEASUREMENT_SURFACES)[number];
  reason: (typeof QUIET_REASONS)[number];
}

export interface ActionSelectedEvent extends MeasurementEventBase {
  type: "action_selected";
  surface: (typeof MEASUREMENT_SURFACES)[number];
  action: (typeof MEASUREMENT_ACTIONS)[number];
}

export interface ConnectionStartedEvent extends MeasurementEventBase {
  type: "connection_started";
  direction: (typeof CONNECTION_DIRECTIONS)[number];
}

export interface ConnectionStatusChangedEvent extends MeasurementEventBase {
  type: "connection_status_changed";
  status: (typeof CONNECTION_STATUSES)[number];
}

export interface ContributionCreatedEvent extends MeasurementEventBase {
  type: "contribution_created";
  kind: (typeof CONTRIBUTION_KINDS)[number];
}

export interface ReturnDiscoveryEvent extends MeasurementEventBase {
  type: "return_discovery";
  entryPoint: (typeof MEASUREMENT_SURFACES)[number];
}

export type MeasurementEvent =
  | SearchSubmittedEvent
  | LocalityResolvedEvent
  | IntentResolvedEvent
  | DiscoveryResultEvent
  | QuietResultEvent
  | ActionSelectedEvent
  | ConnectionStartedEvent
  | ConnectionStatusChangedEvent
  | ContributionCreatedEvent
  | ReturnDiscoveryEvent;

export type MeasurementValidationError =
  | "not_object"
  | "unknown_type"
  | "unsupported_version"
  | "invalid_timestamp"
  | "missing_or_extra_fields"
  | "invalid_field";

export type MeasurementValidation =
  { valid: true; event: MeasurementEvent }
  | { valid: false; reason: MeasurementValidationError };

type EnumValues = readonly string[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf<T extends EnumValues>(value: unknown, choices: T): value is T[number] {
  return typeof value === "string" && choices.includes(value);
}

function hasExactFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  return (
    actual.length === expected.length && actual.every((field, index) => field === expected[index])
  );
}

function hasBase(value: Record<string, unknown>): boolean {
  return (
    value.schemaVersion === MEASUREMENT_SCHEMA_VERSION &&
    typeof value.occurredAt === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value.occurredAt) &&
    Number.isFinite(Date.parse(value.occurredAt))
  );
}

/**
 * Validates the closed event schema at runtime.
 *
 * Exact-key checking is intentional: adding raw text, identifiers, session
 * values or an unreviewed field causes rejection rather than silent collection.
 */
export function validateMeasurementEvent(input: unknown): MeasurementValidation {
  if (!isRecord(input)) return { valid: false, reason: "not_object" };

  if (!isOneOf(input.type, MEASUREMENT_EVENT_TYPES)) {
    return { valid: false, reason: "unknown_type" };
  }
  if (input.schemaVersion !== MEASUREMENT_SCHEMA_VERSION) {
    return { valid: false, reason: "unsupported_version" };
  }
  if (!hasBase(input)) return { valid: false, reason: "invalid_timestamp" };

  let fields: readonly string[];
  let fieldsAreValid: boolean;

  switch (input.type) {
    case "search_submitted":
      fields = ["schemaVersion", "occurredAt", "type", "source", "inputLength"];
      fieldsAreValid =
        isOneOf(input.source, MEASUREMENT_SOURCES) &&
        isOneOf(input.inputLength, INPUT_LENGTH_BUCKETS);
      break;
    case "locality_resolved":
      fields = ["schemaVersion", "occurredAt", "type", "outcome", "placeKind"];
      fieldsAreValid =
        isOneOf(input.outcome, LOCALITY_OUTCOMES) && isOneOf(input.placeKind, PLACE_KIND_BUCKETS);
      break;
    case "intent_resolved":
      fields = ["schemaVersion", "occurredAt", "type", "intentFamily", "certainty"];
      fieldsAreValid =
        isOneOf(input.intentFamily, INTENT_FAMILIES) && isOneOf(input.certainty, CERTAINTIES);
      break;
    case "discovery_result":
      fields = [
        "schemaVersion",
        "occurredAt",
        "type",
        "surface",
        "resultCount",
        "dataState",
        "freshness",
      ];
      fieldsAreValid =
        isOneOf(input.surface, MEASUREMENT_SURFACES) &&
        isOneOf(input.resultCount, RESULT_COUNT_BUCKETS) &&
        isOneOf(input.dataState, DATA_STATES) &&
        isOneOf(input.freshness, FRESHNESS_STATES);
      break;
    case "quiet_result":
      fields = ["schemaVersion", "occurredAt", "type", "surface", "reason"];
      fieldsAreValid =
        isOneOf(input.surface, MEASUREMENT_SURFACES) && isOneOf(input.reason, QUIET_REASONS);
      break;
    case "action_selected":
      fields = ["schemaVersion", "occurredAt", "type", "surface", "action"];
      fieldsAreValid =
        isOneOf(input.surface, MEASUREMENT_SURFACES) && isOneOf(input.action, MEASUREMENT_ACTIONS);
      break;
    case "connection_started":
      fields = ["schemaVersion", "occurredAt", "type", "direction"];
      fieldsAreValid = isOneOf(input.direction, CONNECTION_DIRECTIONS);
      break;
    case "connection_status_changed":
      fields = ["schemaVersion", "occurredAt", "type", "status"];
      fieldsAreValid = isOneOf(input.status, CONNECTION_STATUSES);
      break;
    case "contribution_created":
      fields = ["schemaVersion", "occurredAt", "type", "kind"];
      fieldsAreValid = isOneOf(input.kind, CONTRIBUTION_KINDS);
      break;
    case "return_discovery":
      fields = ["schemaVersion", "occurredAt", "type", "entryPoint"];
      fieldsAreValid = isOneOf(input.entryPoint, MEASUREMENT_SURFACES);
      break;
  }

  if (!hasExactFields(input, fields)) {
    return { valid: false, reason: "missing_or_extra_fields" };
  }
  if (!fieldsAreValid) return { valid: false, reason: "invalid_field" };

  return { valid: true, event: input as unknown as MeasurementEvent };
}
