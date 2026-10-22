import { describe, expect, it } from "vitest";

import {
  assertCompleteSourceRecordScan,
  readBoundedSourceRecordPages,
  SourceRecordScanLimitError,
} from "./source-record-pagination";

type Row = { id: string; lastSeenAt: number };

function orderedRows(count: number): Row[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index + 1).padStart(4, "0"),
    lastSeenAt: index,
  }));
}

describe("bounded source-record pagination", () => {
  it("reads adjacent keyset pages by immutable ID until a short page proves completion", async () => {
    const source = orderedRows(7);
    const calls: Array<[string | null, number]> = [];
    const rows = await readBoundedSourceRecordPages(10, 3, async (afterId, limit) => {
      calls.push([afterId, limit]);
      return source.filter((row) => afterId === null || row.id > afterId).slice(0, limit);
    });

    expect(rows.map((row) => row.id)).toEqual(source.map((row) => row.id));
    expect(calls).toEqual([
      [null, 3],
      ["0003", 3],
      ["0006", 3],
    ]);
  });

  it("probes cap plus one and rejects an incomplete scan instead of returning partial evidence", async () => {
    const source = orderedRows(6);
    const calls: Array<[string | null, number]> = [];
    await expect(
      readBoundedSourceRecordPages(5, 2, async (afterId, limit) => {
        calls.push([afterId, limit]);
        return source.filter((row) => afterId === null || row.id > afterId).slice(0, limit);
      }),
    ).rejects.toBeInstanceOf(SourceRecordScanLimitError);
    expect(calls).toEqual([
      [null, 2],
      ["0002", 2],
      ["0004", 2],
    ]);
  });

  it("requires an exact count to reject row-capped provenance reads", () => {
    const complete = orderedRows(3);
    expect(assertCompleteSourceRecordScan(complete, 3)).toEqual(complete);
    expect(() => assertCompleteSourceRecordScan(complete, null)).toThrow(
      /exact source-record count/i,
    );
    expect(() => assertCompleteSourceRecordScan(complete.slice(0, 2), 3)).toThrow(
      /scan incomplete/i,
    );
  });

  it("rejects an exact source-record count above the safety cap", () => {
    expect(() => assertCompleteSourceRecordScan([], 6, 5)).toThrow(SourceRecordScanLimitError);
  });

  it("accepts exactly the cap when the sentinel query proves there are no more rows", async () => {
    const source = orderedRows(5);
    const calls: Array<[string | null, number]> = [];
    const rows = await readBoundedSourceRecordPages(5, 2, async (afterId, limit) => {
      calls.push([afterId, limit]);
      return source.filter((row) => afterId === null || row.id > afterId).slice(0, limit);
    });

    expect(rows.map((row) => row.id)).toEqual(source.map((row) => row.id));
    expect(calls).toEqual([
      [null, 2],
      ["0002", 2],
      ["0004", 2],
    ]);
  });

  it("does not let changes to mutable last-seen values reorder the existing cursor scan", async () => {
    const source = orderedRows(5);
    const calls: Array<string | null> = [];
    const rows = await readBoundedSourceRecordPages(10, 2, async (afterId, limit) => {
      calls.push(afterId);
      const page = source
        .filter((row) => afterId === null || row.id > afterId)
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, limit);
      if (afterId === null) {
        // Simulate ingestion updating mutable observation timestamps after page one.
        source[2]!.lastSeenAt = 10_000;
        source[3]!.lastSeenAt = -10_000;
        source[4]!.lastSeenAt = 20_000;
      }
      return page;
    });

    expect(rows.map((row) => row.id)).toEqual(["0001", "0002", "0003", "0004", "0005"]);
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
    expect(calls).toEqual([null, "0002", "0004"]);
  });

  it("rejects missing, duplicate, or out-of-order cursor IDs", async () => {
    await expect(readBoundedSourceRecordPages(10, 2, async () => [{ id: "" }])).rejects.toThrow(
      /missing cursor ID/i,
    );
    await expect(
      readBoundedSourceRecordPages(10, 2, async () => [{ id: "b" }, { id: "a" }]),
    ).rejects.toThrow(/strictly increasing/i);
    await expect(readBoundedSourceRecordPages(10, 1, async () => [{ id: "a" }])).rejects.toThrow(
      /strictly increasing/i,
    );
  });

  it("propagates failed pages rather than silently treating partial results as complete", async () => {
    await expect(
      readBoundedSourceRecordPages(10, 2, async (afterId) => {
        if (afterId === "0002") throw new Error("read failed");
        return orderedRows(4)
          .filter((row) => afterId === null || row.id > afterId)
          .slice(0, 2);
      }),
    ).rejects.toThrow("read failed");
  });

  it("rejects unsafe scan limits", async () => {
    await expect(readBoundedSourceRecordPages(0, 10, async () => [])).rejects.toThrow(RangeError);
    await expect(readBoundedSourceRecordPages(10, 0, async () => [])).rejects.toThrow(RangeError);
  });
});
