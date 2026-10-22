import { describe, expect, it } from "vitest";
import {
  chunkOpportunityPlaceIds,
  MAX_OPPORTUNITY_PLACE_IDS,
  mergeNewestNeedRows,
  OpportunityScopeTooWideError,
} from "./opportunity-query";

describe("chunkOpportunityPlaceIds", () => {
  it("deduplicates IDs and preserves complete, bounded chunks", () => {
    const ids = [...Array.from({ length: 805 }, (_, index) => `place-${index}`), "place-0"];
    const chunks = chunkOpportunityPlaceIds(ids);

    expect(chunks.map((chunk) => chunk.length)).toEqual([400, 400, 5]);
    expect(chunks.flat()).toHaveLength(805);
    expect(new Set(chunks.flat()).size).toBe(805);
    expect(chunks.flat()).toEqual(ids.slice(0, 805));
  });

  it("fails closed instead of dropping the locality predicate over the total cap", () => {
    const ids = Array.from({ length: MAX_OPPORTUNITY_PLACE_IDS + 1 }, (_, index) => `p-${index}`);

    expect(() => chunkOpportunityPlaceIds(ids)).toThrow(OpportunityScopeTooWideError);
    expect(() => chunkOpportunityPlaceIds(ids)).toThrow(/Choose a narrower area/);
  });

  it("validates its work bounds", () => {
    expect(() => chunkOpportunityPlaceIds(["a"], 0)).toThrow(RangeError);
    expect(() => chunkOpportunityPlaceIds(["a"], 1, 0)).toThrow(RangeError);
    expect(chunkOpportunityPlaceIds([])).toEqual([]);
  });
});

describe("mergeNewestNeedRows", () => {
  const row = (id: string, created_at: string) => ({ id, created_at });

  it("merges chunks newest-first, de-duplicates rows and breaks timestamp ties by ID", () => {
    const pages = [
      [row("c", "2026-10-22T12:00:00.000Z"), row("a", "2026-10-22T10:00:00.000Z")],
      [row("b", "2026-10-22T12:00:00.000Z"), row("a", "2026-10-22T10:00:00.000Z")],
    ];

    expect(mergeNewestNeedRows(pages)).toEqual([
      row("b", "2026-10-22T12:00:00.000Z"),
      row("c", "2026-10-22T12:00:00.000Z"),
      row("a", "2026-10-22T10:00:00.000Z"),
    ]);
  });

  it("returns only the globally newest N rows", () => {
    const pages = [
      [row("n3", "2026-10-22T03:00:00.000Z"), row("n1", "2026-10-22T01:00:00.000Z")],
      [row("n4", "2026-10-22T04:00:00.000Z"), row("n2", "2026-10-22T02:00:00.000Z")],
    ];

    expect(mergeNewestNeedRows(pages, 2).map((item) => item.id)).toEqual(["n4", "n3"]);
    expect(mergeNewestNeedRows(pages, 0)).toEqual([]);
    expect(() => mergeNewestNeedRows(pages, -1)).toThrow(RangeError);
  });
});
