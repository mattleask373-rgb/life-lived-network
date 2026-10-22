import { describe, expect, it } from "vitest";

import {
  readBoundedSourceRecordPages,
  SourceRecordScanLimitError,
} from "./source-record-pagination";

describe("bounded source-record pagination", () => {
  it("reads adjacent stable pages until a short page proves the scan is complete", async () => {
    const source = Array.from({ length: 7 }, (_, index) => index);
    const calls: Array<[number, number]> = [];
    const rows = await readBoundedSourceRecordPages(10, 3, async (from, to) => {
      calls.push([from, to]);
      return source.slice(from, to + 1);
    });

    expect(rows).toEqual(source);
    expect(calls).toEqual([[0, 2], [3, 5], [6, 8]]);
  });

  it("probes cap plus one and rejects an incomplete scan instead of returning partial evidence", async () => {
    const source = Array.from({ length: 6 }, (_, index) => index);
    const calls: Array<[number, number]> = [];
    await expect(
      readBoundedSourceRecordPages(5, 2, async (from, to) => {
        calls.push([from, to]);
        return source.slice(from, to + 1);
      }),
    ).rejects.toBeInstanceOf(SourceRecordScanLimitError);
    expect(calls).toEqual([[0, 1], [2, 3], [4, 5]]);
  });

  it("accepts exactly the cap only after an empty sentinel read proves completeness", async () => {
    const source = [0, 1, 2, 3, 4];
    const calls: Array<[number, number]> = [];
    const rows = await readBoundedSourceRecordPages(5, 2, async (from, to) => {
      calls.push([from, to]);
      return source.slice(from, to + 1);
    });

    expect(rows).toEqual(source);
    expect(calls).toEqual([[0, 1], [2, 3], [4, 5]]);
  });

  it("propagates failed pages rather than silently treating partial results as complete", async () => {
    await expect(
      readBoundedSourceRecordPages(10, 2, async (from) => {
        if (from === 2) throw new Error("read failed");
        return [from, from + 1];
      }),
    ).rejects.toThrow("read failed");
  });

  it("rejects unsafe scan limits", async () => {
    await expect(readBoundedSourceRecordPages(0, 10, async () => [])).rejects.toThrow(RangeError);
    await expect(readBoundedSourceRecordPages(10, 0, async () => [])).rejects.toThrow(RangeError);
  });
});
