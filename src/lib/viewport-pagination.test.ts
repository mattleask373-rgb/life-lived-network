import { describe, expect, it } from "vitest";

import {
  canLoadMoreViewportPages,
  combineViewportPages,
  MAX_VIEWPORT_PAGES,
} from "./viewport-pagination";
import type { Page } from "./data/contract";

function page<T>(items: T[], nextCursor: string | null, hasMore: boolean): Page<T> {
  return { items, nextCursor, hasMore };
}

describe("bounded viewport pagination", () => {
  it("combines pages, preferring a later duplicate record without changing list order", () => {
    const combined = combineViewportPages([
      page(
        [
          { id: "a", title: "older" },
          { id: "b", title: "B" },
        ],
        "o:2",
        true,
      ),
      page(
        [
          { id: "a", title: "newer" },
          { id: "c", title: "C" },
        ],
        null,
        false,
      ),
    ]);

    expect(combined.items).toEqual([
      { id: "a", title: "newer" },
      { id: "b", title: "B" },
      { id: "c", title: "C" },
    ]);
    expect(combined.nextCursor).toBeNull();
    expect(combined.hasMore).toBe(false);
  });

  it("uses the last page cursor and has-more state", () => {
    expect(combineViewportPages([page([{ id: "a" }], "o:1", true), page([{ id: "b" }], "o:2", true)])).toEqual({
      items: [{ id: "a" }, { id: "b" }],
      nextCursor: "o:2",
      hasMore: true,
    });
  });

  it("returns an empty page for no loaded pages", () => {
    expect(combineViewportPages([])).toEqual({ items: [], nextCursor: null, hasMore: false });
  });

  it("allows manual paging only while more data exists and the page cap is not reached", () => {
    expect(canLoadMoreViewportPages(1, true)).toBe(true);
    expect(canLoadMoreViewportPages(MAX_VIEWPORT_PAGES - 1, true)).toBe(true);
    expect(canLoadMoreViewportPages(MAX_VIEWPORT_PAGES, true)).toBe(false);
    expect(canLoadMoreViewportPages(1, false)).toBe(false);
  });
});
