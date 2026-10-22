import { describe, expect, it } from "vitest";

import { PLACE_SCAN_LIMIT, PlaceScanLimitError, readBoundedPlacePages } from "./bounded-place-scan";

type Row = { id: string; name: string };

function rows(count: number): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1).padStart(5, "0"),
    name: `Place ${i + 1}`,
  }));
}

describe("bounded canonical-place scan", () => {
  it("reads stable keyset pages and returns the complete hierarchy on a short page", async () => {
    const source = rows(7);
    const calls: Array<[string | null, number]> = [];
    const result = await readBoundedPlacePages(20, 3, async (afterId, limit) => {
      calls.push([afterId, limit]);
      return source.filter((item) => afterId === null || item.id > afterId).slice(0, limit);
    });
    expect(result.map((item) => item.id)).toEqual(source.map((item) => item.id));
    expect(calls).toEqual([
      [null, 3],
      ["00003", 3],
      ["00006", 3],
    ]);
  });

  it("probes cap plus one and rejects instead of returning a truncated hierarchy", async () => {
    const source = rows(6);
    await expect(
      readBoundedPlacePages(5, 2, async (afterId, limit) =>
        source.filter((item) => afterId === null || item.id > afterId).slice(0, limit),
      ),
    ).rejects.toBeInstanceOf(PlaceScanLimitError);
  });

  it("accepts exactly the cap when a final short page proves completion", async () => {
    const source = rows(5);
    const calls: Array<[string | null, number]> = [];
    const result = await readBoundedPlacePages(5, 2, async (afterId, limit) => {
      calls.push([afterId, limit]);
      return source.filter((item) => afterId === null || item.id > afterId).slice(0, limit);
    });
    expect(result).toHaveLength(5);
    expect(calls.at(-1)).toEqual(["00004", 2]);
  });

  it("propagates a failed later page rather than returning earlier rows as complete", async () => {
    await expect(
      readBoundedPlacePages(10, 2, async (afterId, limit) => {
        if (afterId === "00002") throw new Error("page failed");
        return rows(5)
          .filter((item) => afterId === null || item.id > afterId)
          .slice(0, limit);
      }),
    ).rejects.toThrow("page failed");
  });

  it("rejects missing, duplicate, or out-of-order cursor IDs", async () => {
    await expect(readBoundedPlacePages(10, 2, async () => [{ id: "" }])).rejects.toThrow(
      /missing cursor ID/i,
    );
    await expect(
      readBoundedPlacePages(10, 2, async () => [{ id: "b" }, { id: "a" }]),
    ).rejects.toThrow(/strictly increasing/i);
    await expect(
      readBoundedPlacePages(10, 1, async (afterId) => [{ id: afterId ?? "a" }]),
    ).rejects.toThrow(/strictly increasing/i);
  });

  it("exposes a generous finite cap and rejects invalid limits", async () => {
    expect(PLACE_SCAN_LIMIT).toBe(50_000);
    await expect(readBoundedPlacePages(0, 1, async () => [])).rejects.toThrow(RangeError);
    await expect(readBoundedPlacePages(1, 0, async () => [])).rejects.toThrow(RangeError);
  });
});
