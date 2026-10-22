import { describe, expect, it } from "vitest";
import {
  chunkOpportunityPlaceIds,
  MAX_OPPORTUNITY_PLACE_IDS,
  OPPORTUNITY_PLACE_CHUNK_SIZE,
  OPPORTUNITY_CANDIDATES_PER_CHUNK,
  mergeNewestNeedRows,
  boundOpportunityPage,
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

  it("covers the 400/401 and 5,000/5,001 scope boundaries", () => {
    expect(chunkOpportunityPlaceIds(["p-0"])).toHaveLength(1);

    const atFilterCap = Array.from({ length: OPPORTUNITY_PLACE_CHUNK_SIZE }, (_, i) => `p-${i}`);
    expect(chunkOpportunityPlaceIds(atFilterCap)).toHaveLength(1);

    const overFilterCap = [...atFilterCap, "p-400"];
    expect(chunkOpportunityPlaceIds(overFilterCap).map((chunk) => chunk.length)).toEqual([400, 1]);

    const atTotalCap = Array.from({ length: MAX_OPPORTUNITY_PLACE_IDS }, (_, i) => `scope-${i}`);
    const chunks = chunkOpportunityPlaceIds(atTotalCap);
    expect(chunks).toHaveLength(
      Math.ceil(MAX_OPPORTUNITY_PLACE_IDS / OPPORTUNITY_PLACE_CHUNK_SIZE),
    );
    expect(chunks.flat()).toHaveLength(MAX_OPPORTUNITY_PLACE_IDS);
    expect(chunks.every((chunk) => chunk.length <= OPPORTUNITY_PLACE_CHUNK_SIZE)).toBe(true);
    expect(chunks.length * OPPORTUNITY_CANDIDATES_PER_CHUNK).toBeLessThanOrEqual(780);

    expect(() => chunkOpportunityPlaceIds([...atTotalCap, "scope-over-cap"])).toThrow(
      OpportunityScopeTooWideError,
    );
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

describe("boundOpportunityPage", () => {
  it("distinguishes an exact-cap read from an over-cap read using a sentinel row", () => {
    const exact = Array.from({ length: OPPORTUNITY_CANDIDATES_PER_CHUNK }, (_, i) => i);
    const over = [...exact, OPPORTUNITY_CANDIDATES_PER_CHUNK];

    expect(boundOpportunityPage(exact)).toEqual({ rows: exact, truncated: false });
    expect(boundOpportunityPage(over)).toEqual({ rows: exact, truncated: true });
    expect(boundOpportunityPage(over).rows).toHaveLength(OPPORTUNITY_CANDIDATES_PER_CHUNK);
  });

  it("treats a missing row collection as a failed read, not an empty result", () => {
    expect(() => boundOpportunityPage(null)).toThrow(/no row collection/i);
    expect(() => boundOpportunityPage(undefined)).toThrow(/no row collection/i);
    expect(boundOpportunityPage([])).toEqual({ rows: [], truncated: false });
  });

  it("validates the per-query bound", () => {
    expect(() => boundOpportunityPage([1], 0)).toThrow(RangeError);
    expect(() => boundOpportunityPage([1], Number.NaN)).toThrow(RangeError);
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

  it("can retain the whole bounded per-chunk candidate window beyond 60 rows", () => {
    const rows = Array.from({ length: 780 }, (_, index) => ({
      id: `need-${String(index).padStart(3, "0")}`,
      created_at: new Date(Date.UTC(2026, 9, 22, 0, index)).toISOString(),
    }));
    const merged = mergeNewestNeedRows([rows], 780);

    expect(merged).toHaveLength(780);
    expect(merged[0]?.id).toBe("need-779");
    expect(merged.at(-1)?.id).toBe("need-000");
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
