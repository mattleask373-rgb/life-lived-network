import { describe, expect, it } from "vitest";

import { DataError } from "./errors";
import { assertLocalityFilterBounded, LOCALITY_FILTER_CAP } from "./locality-scope";

describe("locality discovery filter scope", () => {
  it("allows a locality scope at the configured cap", () => {
    expect(() =>
      assertLocalityFilterBounded(Array.from({ length: LOCALITY_FILTER_CAP }, (_, i) => String(i))),
    ).not.toThrow();
  });

  it("rejects an oversized locality scope instead of widening the read", () => {
    let caught: unknown;
    try {
      assertLocalityFilterBounded(
        Array.from({ length: LOCALITY_FILTER_CAP + 1 }, (_, i) => String(i)),
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DataError);
    expect((caught as DataError).code).toBe("INVALID_CONTEXT");
    expect((caught as Error).message).not.toContain("401");
  });

  it("allows an explicitly unfiltered top-level discovery scope", () => {
    expect(() => assertLocalityFilterBounded([])).not.toThrow();
  });
});
