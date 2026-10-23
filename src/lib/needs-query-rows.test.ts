import { describe, expect, it } from "vitest";

import { DataError } from "./data/errors";
import { requireCompleteQueryRows } from "./needs-query-rows";

function expectErrorCode(run: () => unknown, code: string) {
  let thrown: unknown;
  try {
    run();
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(DataError);
  expect((thrown as DataError).code).toBe(code);
}

describe("complete need-query row collections", () => {
  it("accepts a verified empty collection and an exact complete result", () => {
    expect(requireCompleteQueryRows({ data: [], error: null, count: 0 }, "test")).toEqual([]);
    expect(
      requireCompleteQueryRows({ data: [{ id: "one" }], error: null, count: 1 }, "test"),
    ).toEqual([{ id: "one" }]);
  });

  it("fails closed on query errors, missing row collections, or absent exact counts", () => {
    expectErrorCode(
      () =>
        requireCompleteQueryRows({ data: null, error: new Error("network"), count: null }, "test"),
      "DATA_UNAVAILABLE",
    );
    expectErrorCode(
      () => requireCompleteQueryRows({ data: null, error: null, count: 0 }, "test"),
      "DATA_UNAVAILABLE",
    );
    expectErrorCode(
      () => requireCompleteQueryRows({ data: [], error: null, count: null }, "test"),
      "DATA_UNAVAILABLE",
    );
  });

  it("rejects a result whose exact count exceeds the returned collection", () => {
    expectErrorCode(
      () => requireCompleteQueryRows({ data: [{ id: "one" }], error: null, count: 2 }, "test"),
      "DATA_UNAVAILABLE",
    );
  });

  it("returns an explicit too-wide error instead of scoring a capped candidate set", () => {
    expectErrorCode(
      () =>
        requireCompleteQueryRows(
          { data: [{ id: "one" }], error: null, count: 151 },
          "listing candidates",
          150,
        ),
      "SCOPE_TOO_WIDE",
    );
  });
});
