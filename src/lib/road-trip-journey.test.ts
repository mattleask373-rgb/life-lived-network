import { describe, expect, it } from "vitest";

import {
  addJourneyStop,
  draftFromPlan,
  hasJourneyStop,
  moveJourneyStop,
  readRoadTripDraft,
  removeJourneyStop,
  writeRoadTripDraft,
} from "./road-trip-journey";
import type { Place } from "./places";

function place(id: string): Place {
  return {
    id,
    parent_id: null,
    kind: "city",
    name: id,
    slug: id,
    country_code: "GB",
    timezone: "Europe/London",
    currency: "GBP",
    lat: 52,
    lng: -2,
    blurb: "",
  };
}

describe("road-trip journey draft", () => {
  it("does not add a stop twice", () => {
    const once = addJourneyStop([], "abbey");
    const twice = addJourneyStop(once, "abbey");
    expect(twice).toEqual(["abbey"]);
    expect(hasJourneyStop(twice, "abbey")).toBe(true);
  });

  it("moves stops without losing their identities", () => {
    expect(moveJourneyStop(["a", "b", "c"], "b", "up")).toEqual(["b", "a", "c"]);
    expect(moveJourneyStop(["a", "b", "c"], "b", "down")).toEqual(["a", "c", "b"]);
    expect(moveJourneyStop(["a", "b", "c"], "a", "down")).toEqual(["b", "a", "c"]);
    expect(moveJourneyStop(["a", "b", "c"], "c", "up")).toEqual(["a", "c", "b"]);
    expect(moveJourneyStop(["a", "b"], "a", "up")).toEqual(["a", "b"]);
    const firstMove = moveJourneyStop(["a", "b", "c"], "b", "down");
    expect(moveJourneyStop(firstMove, "b", "up")).toEqual(["a", "b", "c"]);
  });

  it("removes only the chosen stop", () => {
    const remaining = removeJourneyStop(["a", "b", "c"], "b");
    expect(remaining).toEqual(["a", "c"]);
    expect(hasJourneyStop(remaining, "b")).toBe(false);
  });

  it("serialises and restores the complete ordered draft", () => {
    const draft = draftFromPlan(
      {
        from: place("birmingham"),
        to: place("bristol"),
        mode: "cycling",
        date: "2026-09-19",
        interests: ["history", "food"],
      },
      ["museum", "market", "abbey"],
    );
    expect(readRoadTripDraft(JSON.stringify(draft))).toEqual(draft);
    expect(draft.stopIds).toEqual(["museum", "market", "abbey"]);
  });

  it("rejects malformed stored data and deduplicates valid stop ids", () => {
    expect(readRoadTripDraft("not json")).toBeNull();
    expect(readRoadTripDraft(JSON.stringify({ version: 3 }))).toBeNull();
    expect(readRoadTripDraft(JSON.stringify({ version: 1 }))).toBeNull();
    expect(
      readRoadTripDraft(
        JSON.stringify({
          version: 2,
          fromId: "birmingham",
          toId: "bristol",
          mode: "driving",
          date: "2026-09-19",
          interests: ["history"],
          stopIds: ["museum", "museum"],
          stopEntries: [],
        }),
      )?.stopIds,
    ).toEqual(["museum"]);
  });

  it("does not break when browser storage is unavailable", () => {
    expect(
      writeRoadTripDraft(
        {
          setItem: () => {
            throw new Error("blocked");
          },
        },
        draftFromPlan(
          { from: place("birmingham"), to: place("bristol"), mode: "driving", interests: [] },
          [],
        ),
      ),
    ).toBe(false);
  });
});
