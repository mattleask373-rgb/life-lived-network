import { describe, expect, it } from "vitest";

import { demoEntriesFor } from "./demo-layer";

const entries = [
  { id: "a", placeSlug: "brixton" },
  { id: "b", placeSlug: "birmingham" },
];

describe("demoEntriesFor", () => {
  it("returns nothing when fixtures are not allowed, even for a selected locality", () => {
    expect(demoEntriesFor(entries, new Set(["brixton"]), false)).toEqual([]);
    expect(demoEntriesFor(entries, new Set(), false)).toEqual([]);
  });

  it("only returns the selected locality's records when allowed", () => {
    expect(demoEntriesFor(entries, new Set(["brixton"]), true).map((e) => e.id)).toEqual(["a"]);
  });

  it("keeps a locality with no demo records quiet", () => {
    expect(demoEntriesFor(entries, new Set(["leeds"]), true)).toEqual([]);
  });

  it("returns the whole layer when allowed with no selection", () => {
    expect(demoEntriesFor(entries, new Set(), true)).toHaveLength(2);
  });
});
