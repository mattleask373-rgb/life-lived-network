import { describe, expect, it } from "vitest";

import {
  addJourneyStop,
  moveJourneyStop,
  readRoadTripDraft,
  removeJourneyStop,
} from "./road-trip-journey";

describe("road-trip journey draft", () => {
  it("does not add a stop twice", () => {
    expect(addJourneyStop(["abbey"], "abbey")).toEqual(["abbey"]);
  });

  it("moves stops without losing their identities", () => {
    expect(moveJourneyStop(["a", "b", "c"], "b", "up")).toEqual(["b", "a", "c"]);
    expect(moveJourneyStop(["a", "b", "c"], "b", "down")).toEqual(["a", "c", "b"]);
    expect(moveJourneyStop(["a", "b"], "a", "up")).toEqual(["a", "b"]);
  });

  it("removes only the chosen stop", () => {
    expect(removeJourneyStop(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("rejects malformed stored data and deduplicates valid stop ids", () => {
    expect(readRoadTripDraft("not json")).toBeNull();
    expect(readRoadTripDraft(JSON.stringify({ version: 1 }))).toBeNull();
    expect(readRoadTripDraft(JSON.stringify({
      version: 1,
      fromId: "birmingham",
      toId: "bristol",
      mode: "driving",
      date: "2026-09-19",
      interests: ["history"],
      stopIds: ["museum", "museum"],
    }))?.stopIds).toEqual(["museum"]);
  });
});