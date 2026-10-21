import { describe, expect, it } from "vitest";

import { isLocalityScopeFilterable, MAX_LOCALITY_FILTER_IDS } from "./locality-scope";

describe("bounded locality filter scope", () => {
  it("accepts a locality scope at the configured filter limit", () => {
    expect(isLocalityScopeFilterable(Array.from({ length: MAX_LOCALITY_FILTER_IDS }, (_, i) => String(i)))).toBe(true);
  });

  it("rejects a locality scope that would otherwise drop the selected place filter", () => {
    expect(
      isLocalityScopeFilterable(
        Array.from({ length: MAX_LOCALITY_FILTER_IDS + 1 }, (_, i) => String(i)),
      ),
    ).toBe(false);
  });

  it("allows an empty filter so the caller can use an explicit single-place predicate", () => {
    expect(isLocalityScopeFilterable([])).toBe(true);
  });
});
