import { describe, expect, it } from "vitest";
import { DataError } from "./errors";
import { requireQueryRows } from "./query-rows";

describe("requireQueryRows", () => {
  it("preserves a query failure instead of converting it to an empty collection", () => {
    const failure = new Error("database unavailable");

    expect(() => requireQueryRows(null, failure, "World listing")).toThrow(failure);
  });

  it("fails closed when a successful response has no row collection", () => {
    for (const rows of [null, undefined]) {
      let thrown: unknown;
      try {
        requireQueryRows(rows, null, "World listing");
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(DataError);
      expect((thrown as DataError).code).toBe("DATA_UNAVAILABLE");
    }
  });

  it("preserves a verified empty result and non-empty rows", () => {
    expect(requireQueryRows([], null, "World listing")).toEqual([]);
    expect(requireQueryRows([{ id: "listing-1" }], null, "World listing")).toEqual([
      { id: "listing-1" },
    ]);
  });
});
