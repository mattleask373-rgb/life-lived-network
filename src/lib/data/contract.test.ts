import { describe, expect, it } from "vitest";

import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  decodeCursor,
  emptyPage,
  encodeCursor,
  pageLimit,
  splitPageWithLookahead,
  toPage,
} from "./contract";
import { DataError, asDataError, isDataErrorCode } from "./errors";

describe("paging is bounded and opaque", () => {
  it("never lets a caller ask for an unbounded page", () => {
    expect(pageLimit(undefined)).toBe(DEFAULT_LIMIT);
    expect(pageLimit(0)).toBe(DEFAULT_LIMIT);
    expect(pageLimit(-5)).toBe(DEFAULT_LIMIT);
    expect(pageLimit(10_000)).toBe(MAX_LIMIT);
    expect(pageLimit(25)).toBe(25);
  });

  it("round-trips cursors without exposing offsets to callers", () => {
    expect(decodeCursor(encodeCursor(60))).toBe(60);
    expect(decodeCursor(null)).toBe(0);
    expect(decodeCursor("nonsense")).toBe(0);
  });

  it("uses a sentinel row to distinguish exactly-full from genuinely-more pages", () => {
    expect(splitPageWithLookahead([1, 2], 3)).toEqual({ items: [1, 2], hasMore: false });
    expect(splitPageWithLookahead([1, 2, 3], 3)).toEqual({ items: [1, 2, 3], hasMore: false });
    expect(splitPageWithLookahead([1, 2, 3, 4], 3)).toEqual({ items: [1, 2, 3], hasMore: true });
  });

  it("rejects invalid look-ahead limits", () => {
    expect(() => splitPageWithLookahead([1], 0)).toThrow(RangeError);
    expect(() => splitPageWithLookahead([1], 1.5)).toThrow(RangeError);
  });

  it("uses explicit lookahead evidence rather than guessing from page length", () => {
    const exactlyFullFinalPage = toPage([1, 2, 3], 0, false);
    expect(exactlyFullFinalPage.hasMore).toBe(false);
    expect(exactlyFullFinalPage.nextCursor).toBeNull();

    const fullPageWithMore = toPage([1, 2, 3], 0, true);
    expect(fullPageWithMore.hasMore).toBe(true);
    expect(fullPageWithMore.nextCursor).toBe(encodeCursor(3));

    const partialFinalPage = toPage([1, 2], 0, false);
    expect(partialFinalPage.hasMore).toBe(false);
    expect(partialFinalPage.nextCursor).toBeNull();

    expect(() => toPage<number>([], 0, true)).toThrow(RangeError);
    expect(emptyPage<number>()).toEqual({ items: [], nextCursor: null, hasMore: false });
  });
});

describe("data errors stay predictable and quiet", () => {
  it("maps unknown failures to a safe message", () => {
    const error = asDataError(new Error('relation "listings" does not exist'));
    expect(error).toBeInstanceOf(DataError);
    expect(error.code).toBe("DATA_UNAVAILABLE");
    expect(error.message).not.toContain("listings");
  });

  it("recognises safe data error codes after server serialization", () => {
    expect(isDataErrorCode(new DataError("SCOPE_TOO_WIDE"), "SCOPE_TOO_WIDE")).toBe(true);
    expect(
      isDataErrorCode(
        {
          name: "DataError",
          code: "SCOPE_TOO_WIDE",
          message:
            "This area is too large to search all at once. Choose a smaller area or zoom in.",
        },
        "SCOPE_TOO_WIDE",
      ),
    ).toBe(true);
    expect(isDataErrorCode(new DataError("DATA_UNAVAILABLE"), "SCOPE_TOO_WIDE")).toBe(false);
  });

  it("recognises auth and policy failures", () => {
    expect(asDataError(new Error("invalid JWT")).code).toBe("UNAUTHENTICATED");
    expect(asDataError(new Error("row-level security policy")).code).toBe("FORBIDDEN");
  });
});
