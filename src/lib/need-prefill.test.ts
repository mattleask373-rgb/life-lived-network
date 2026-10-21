import { describe, expect, it } from "vitest";

import { needPrefillForService, parseNeedSearch } from "./need-prefill";

describe("need prefill query", () => {
  it("retains bounded title and category as editable prefill only", () => {
    expect(
      parseNeedSearch({ from: "  Find work   like this ", category: "  Garden   maintenance " }),
    ).toEqual({
      from: "Find work like this",
      category: "Garden maintenance",
    });
  });

  it("preserves a canonical place slug alongside service and title", () => {
    const prefill = needPrefillForService({
      categorySlug: "gardening",
      categoryLabel: "Gardening",
      placeSlug: "newtown",
      placeName: "Newtown",
    });

    expect(prefill).toEqual({
      category: "gardening",
      place: "newtown",
      from: "Looking for gardening help in Newtown",
    });
    expect(parseNeedSearch(prefill)).toEqual(prefill);
  });

  it("keeps bounded unresolved place input so the form can fail closed instead of defaulting", () => {
    expect(parseNeedSearch({ place: "not-a-real-place" }).place).toBe("not-a-real-place");
    expect(parseNeedSearch({ place: "P".repeat(150) }).place).toHaveLength(100);
  });

  it("drops invalid and empty categories and bounds long values", () => {
    expect(parseNeedSearch({ category: 42 })).toEqual({});
    expect(parseNeedSearch({ category: "   " })).toEqual({});
    expect(parseNeedSearch({ category: "x".repeat(200) }).category).toHaveLength(100);
    expect(parseNeedSearch({ from: "t".repeat(250) }).from).toHaveLength(200);
  });
});
