import { describe, expect, it } from "vitest";

import { parseMeasurementEvent } from "./measurement-events";

const dayUTC = "2026-10-22";

describe("privacy-minimised measurement event contract", () => {
  it("accepts a valid search event using only coarse dimensions", () => {
    expect(
      parseMeasurementEvent({
        schemaVersion: 1,
        dayUTC,
        type: "search_submitted",
        entryPoint: "home",
        queryLength: "4_7",
      }),
    ).toEqual({
      schemaVersion: 1,
      dayUTC,
      type: "search_submitted",
      entryPoint: "home",
      queryLength: "4_7",
    });
  });

  it("accepts useful-outcome and quiet-result categories without user or target IDs", () => {
    expect(
      parseMeasurementEvent({
        schemaVersion: 1,
        dayUTC,
        type: "useful_outcome_completed",
        countryCode: "GB",
        outcome: "service_completed",
      }),
    ).toMatchObject({ type: "useful_outcome_completed", countryCode: "GB" });

    expect(
      parseMeasurementEvent({
        schemaVersion: 1,
        dayUTC,
        type: "quiet_result",
        countryCode: "PT",
        intentFamily: "local_service",
        reason: "no_verified_results",
      }),
    ).toMatchObject({ type: "quiet_result", reason: "no_verified_results" });
  });

  it("rejects raw query, account, session, target and contact fields", () => {
    const base = {
      schemaVersion: 1,
      dayUTC,
      type: "search_submitted",
      entryPoint: "home",
      queryLength: "1_3",
    };

    for (const field of [
      "rawQuery",
      "normalizedQuery",
      "userId",
      "sessionId",
      "targetId",
      "recipientPersonId",
      "connectionId",
      "email",
      "phone",
      "coordinates",
      "message",
      "url",
    ]) {
      expect(() => parseMeasurementEvent({ ...base, [field]: "not permitted" })).toThrow(
        /unsupported fields/i,
      );
    }
  });

  it("rejects arbitrary reason strings and unknown event categories", () => {
    expect(() =>
      parseMeasurementEvent({
        schemaVersion: 1,
        dayUTC,
        type: "quiet_result",
        countryCode: "GB",
        intentFamily: "local_service",
        reason: "A user's private situation",
      }),
    ).toThrow(/invalid reason/i);

    expect(() =>
      parseMeasurementEvent({
        schemaVersion: 1,
        dayUTC,
        type: "free_form_event",
      }),
    ).toThrow(/type is unsupported/i);
  });

  it("validates UTC calendar days, country codes and schema version", () => {
    const base = {
      schemaVersion: 1,
      dayUTC,
      type: "return_discovery",
      countryCode: "GB",
      entryPoint: "locality",
    };

    expect(() => parseMeasurementEvent({ ...base, dayUTC: "2026-02-31" })).toThrow(
      /valid yyyy-mm-dd/i,
    );
    expect(() => parseMeasurementEvent({ ...base, countryCode: "gb" })).toThrow(
      /two-letter uppercase/i,
    );
    expect(() => parseMeasurementEvent({ ...base, schemaVersion: 2 })).toThrow(
      /schemaVersion is unsupported/i,
    );
  });

  it("normalizes no event data beyond the explicitly allowed contract", () => {
    const parsed = parseMeasurementEvent({
      schemaVersion: 1,
      dayUTC,
      type: "action_selected",
      action: "start_connection",
      targetKind: "need",
    });
    expect(Object.keys(parsed).sort()).toEqual(
      ["action", "dayUTC", "schemaVersion", "targetKind", "type"].sort(),
    );
  });
});
