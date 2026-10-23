import { describe, expect, it } from "vitest";

import { parseNeedSearch } from "./need-prefill";

describe("need prefill query", () => {
  it("retains bounded title and category as editable prefill only", () => {
    expect(
      parseNeedSearch({
        from: "  Find work   like this ",
        category: "  Garden   maintenance ",
      }),
    ).toEqual({
      from: "Find work like this",
      category: "Garden maintenance",
    });
  });

  it("drops invalid and empty categories and bounds long values", () => {
    expect(parseNeedSearch({ category: 42 })).toEqual({});
    expect(parseNeedSearch({ category: "   " })).toEqual({});
    expect(parseNeedSearch({ category: "x".repeat(200) }).category).toHaveLength(100);
    expect(parseNeedSearch({ from: "t".repeat(250) }).from).toHaveLength(200);
  });
});
