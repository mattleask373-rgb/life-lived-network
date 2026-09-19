import { describe, expect, it } from "vitest";

import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  decodeCursor,
  emptyPage,
  encodeCursor,
  pageLimit,
  toPage,
} from "./contract";
import { DataError, asDataError } from "./errors";

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

  it("only offers a next page when the read filled the limit", () => {
    const full = toPage([1, 2, 3], 0, 3);
    expect(full.hasMore).toBe(true);
    expect(full.nextCursor).not.toBeNull();

    const partial = toPage([1, 2], 0, 3);
    expect(partial.hasMore).toBe(false);
    expect(partial.nextCursor).toBeNull();

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

  it("recognises auth and policy failures", () => {
    expect(asDataError(new Error("invalid JWT")).code).toBe("UNAUTHENTICATED");
    expect(asDataError(new Error("row-level security policy")).code).toBe("FORBIDDEN");
  });
});
