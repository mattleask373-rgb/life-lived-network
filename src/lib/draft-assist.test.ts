import { describe, expect, it } from "vitest";
import { cleanInput, MAX_INPUT, tidyDraft } from "./draft-assist";

describe("draft assist", () => {
  it("caps input length", () => {
    expect(cleanInput("a".repeat(5000)).length).toBe(MAX_INPUT);
  });
  it("caps details and missing at six lines each", () => {
    const d = tidyDraft({
      kind: "need",
      title: "t",
      category: "Gardening",
      summary: "",
      details: Array(10).fill("x"),
      missing: Array(10).fill("y"),
    });
    expect(d.details).toHaveLength(6);
    expect(d.missing).toHaveLength(6);
    expect(d.category).toBe("gardening");
  });
});
