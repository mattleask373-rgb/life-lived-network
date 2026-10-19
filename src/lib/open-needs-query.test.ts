import { describe, expect, it } from "vitest";

import {
  boundedOpenNeedsPlaceScope,
  exactOpenNeedsCount,
  MAX_OPEN_NEEDS_PLACE_IDS,
} from "./open-needs-query";

describe("bounded public open-needs place scope", () => {
  it("keeps a resolved exact-place scope", () => {
    expect(boundedOpenNeedsPlaceScope(["kings-heath"])).toEqual(["kings-heath"]);
  });

  it("accepts the maximum supported number of unique descendant IDs", () => {
    const ids = Array.from({ length: MAX_OPEN_NEEDS_PLACE_IDS }, (_, index) => `place-${index}`);
    expect(boundedOpenNeedsPlaceScope(ids)).toHaveLength(MAX_OPEN_NEEDS_PLACE_IDS);
  });

  it("rejects an unresolved scope instead of permitting an unfiltered query", () => {
    expect(() => boundedOpenNeedsPlaceScope([])).toThrow(/scope could not be resolved/i);
  });

  it("rejects 401 IDs instead of dropping the locality filter", () => {
    const ids = Array.from(
      { length: MAX_OPEN_NEEDS_PLACE_IDS + 1 },
      (_, index) => `place-${index}`,
    );
    expect(() => boundedOpenNeedsPlaceScope(ids)).toThrow(/safe query bound/i);
  });

  it("deduplicates scope IDs before enforcing the query limit", () => {
    const ids = [...Array.from({ length: 400 }, (_, index) => `place-${index}`), "place-0"];
    expect(boundedOpenNeedsPlaceScope(ids)).toHaveLength(400);
  });
});

describe("exact open-needs count metadata", () => {
  it("preserves a known zero", () => {
    expect(exactOpenNeedsCount(0)).toBe(0);
  });

  it("preserves exact counts above the 50-row list limit", () => {
    expect(exactOpenNeedsCount(63)).toBe(63);
  });

  it("fails closed when the database did not return count metadata", () => {
    expect(() => exactOpenNeedsCount(null)).toThrow(/exact open-needs count is unavailable/i);
  });

  it("rejects impossible count values", () => {
    expect(() => exactOpenNeedsCount(-1)).toThrow(/exact open-needs count is unavailable/i);
    expect(() => exactOpenNeedsCount(Number.NaN)).toThrow(/exact open-needs count is unavailable/i);
  });
});
