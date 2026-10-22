import { describe, expect, it } from "vitest";
import { cleanInput, draftInputSchema, MAX_INPUT, tidyDraft } from "./draft-assist";

describe("draft assist", () => {
  it("normalises whitespace and caps input length", () => {
    expect(cleanInput("  I \\n can \\t help  ")).toBe("I can help");
    expect(cleanInput("a".repeat(5000)).length).toBe(MAX_INPUT);
  });

  it("rejects oversized raw request text at the validation boundary", () => {
    expect(() => draftInputSchema.parse({ text: "a".repeat(MAX_INPUT + 1) })).toThrow();
  });

  it("accepts only known hint values and known request fields", () => {
    expect(draftInputSchema.parse({ text: "I can help with gardening", hint: "offer" })).toEqual({
      text: "I can help with gardening",
      hint: "offer",
    });
    expect(() =>
      draftInputSchema.parse({ text: "I can help with gardening", hint: "admin" }),
    ).toThrow();
    expect(() =>
      draftInputSchema.parse({ text: "I can help with gardening", extra: true }),
    ).toThrow();
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
