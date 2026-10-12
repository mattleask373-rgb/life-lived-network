import { describe, expect, it } from "vitest";

import {
  validateMeasurementEvent,
  type MeasurementEvent,
} from "./measurement-contract";

const timestamp = "2026-10-12T18:30:00.000Z";

describe("privacy-safe measurement contract", () => {
  it("accepts bounded funnel events with only approved fields", () => {
    const events: MeasurementEvent[] = [
      {
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "search_submitted",
        source: "front_door",
        inputLength: "21_60",
      },
      {
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "locality_resolved",
        outcome: "resolved",
        placeKind: "city",
      },
      {
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "intent_resolved",
        intentFamily: "local_service",
        certainty: "likely",
      },
      {
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "discovery_result",
        surface: "locality",
        resultCount: "two_to_five",
        dataState: "results",
        freshness: "fresh",
      },
      {
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "quiet_result",
        surface: "locality",
        reason: "no_text_matches",
      },
      {
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "action_selected",
        surface: "need",
        action: "ask_for_help",
      },
      {
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "connection_started",
        direction: "offer",
      },
      {
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "connection_status_changed",
        status: "accepted",
      },
      {
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "contribution_created",
        kind: "hour",
      },
      {
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "return_discovery",
        entryPoint: "home",
      },
    ];

    for (const event of events) {
      expect(validateMeasurementEvent(event)).toEqual({ valid: true, event });
    }
  });

  it.each([
    ["raw search query", { normalizedQuery: "gardener in Brixton" }],
    ["raw query content", { query: "I need urgent help with ..." }],
    ["session identifier", { sessionId: "persistent-session-123" }],
    ["user identifier", { userId: "auth-user-123" }],
    ["connection identifier", { connectionId: "private-connection-123" }],
    ["target identifier", { targetId: "private-need-123" }],
    ["exact coordinates", { lat: 52.48, lng: -1.9 }],
    ["free-form notes", { note: "someone's private note" }],
  ])("rejects added field: %s", (_label, extra) => {
    expect(
      validateMeasurementEvent({
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "search_submitted",
        source: "front_door",
        inputLength: "21_60",
        ...extra,
      }),
    ).toEqual({ valid: false, reason: "missing_or_extra_fields" });
  });

  it("rejects free-form values in fields that are meant to be enumerated", () => {
    expect(
      validateMeasurementEvent({
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "quiet_result",
        surface: "locality",
        reason: "Birmingham has no gardener today",
      }),
    ).toEqual({ valid: false, reason: "invalid_field" });
  });

  it("rejects unsupported versions and unrecognised event names", () => {
    expect(
      validateMeasurementEvent({
        schemaVersion: 2,
        occurredAt: timestamp,
        type: "search_submitted",
        source: "front_door",
        inputLength: "1_20",
      }),
    ).toEqual({ valid: false, reason: "unsupported_version" });

    expect(
      validateMeasurementEvent({
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "raw_query_captured",
      }),
    ).toEqual({ valid: false, reason: "unknown_type" });
  });

  it("requires a valid UTC timestamp", () => {
    expect(
      validateMeasurementEvent({
        schemaVersion: 1,
        occurredAt: "last Tuesday in Birmingham",
        type: "return_discovery",
        entryPoint: "home",
      }),
    ).toEqual({ valid: false, reason: "invalid_timestamp" });
  });

  it("rejects invalid enum values and exact event counts", () => {
    expect(
      validateMeasurementEvent({
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "search_submitted",
        source: "direct_url",
        inputLength: 6000,
      }),
    ).toEqual({ valid: false, reason: "invalid_field" });

    expect(
      validateMeasurementEvent({
        schemaVersion: 1,
        occurredAt: timestamp,
        type: "discovery_result",
        surface: "locality",
        resultCount: 87,
        dataState: "results",
        freshness: "fresh",
      }),
    ).toEqual({ valid: false, reason: "invalid_field" });
  });

  it("rejects arrays, null, and primitive inputs", () => {
    for (const input of [null, [], "event", 7]) {
      expect(validateMeasurementEvent(input)).toEqual({ valid: false, reason: "not_object" });
    }
  });
});
