import { describe, expect, it } from "vitest";

import { LOCALITY_FILTER_CAP, localityQueryScope } from "./locality-query-scope";

describe("fail-closed locality query scope", () => {
  it("uses the selected descendants when the unique ID count is within the cap", () => {
    const ids = Array.from({ length: LOCALITY_FILTER_CAP }, (_, index) => `place-${index}`);
    expect(localityQueryScope("parent", ids)).toEqual({ kind: "place-ids", placeIds: ids });
  });

  it("returns an explicit too-wide state rather than a world-wide fallback", () => {
    const ids = Array.from({ length: LOCALITY_FILTER_CAP + 1 }, (_, index) => `place-${index}`);
    expect(localityQueryScope("parent", ids)).toEqual({
      kind: "too-wide",
      count: LOCALITY_FILTER_CAP + 1,
      cap: LOCALITY_FILTER_CAP,
    });
  });

  it("counts unique IDs, not duplicate input entries", () => {
    const ids = Array.from({ length: LOCALITY_FILTER_CAP }, (_, index) => `place-${index}`);
    expect(localityQueryScope("parent", [...ids, ids[0]!])).toEqual({
      kind: "place-ids",
      placeIds: ids,
    });
  });

  it("falls back only to the exact selected place when there are no descendant IDs", () => {
    expect(localityQueryScope("  place-1 ", [])).toEqual({
      kind: "exact-place",
      placeId: "place-1",
    });
    expect(localityQueryScope(null, [])).toEqual({ kind: "all" });
  });
});
