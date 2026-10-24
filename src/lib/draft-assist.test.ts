import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  cleanInput,
  draftInputSchema,
  isDraftAssistDisabled,
  MAX_INPUT,
  DRAFT_MAX_DURATION_MS,
  DRAFT_MAX_OUTPUT_TOKENS,
  DRAFT_MAX_RETRIES,
  tidyDraft,
} from "./draft-assist";

const providerSource = readFileSync(new URL("./draft-assist.server.ts", import.meta.url), "utf8");

describe("draft assist", () => {
  it("bounds each paid provider attempt by output tokens, retries and total duration", () => {
    expect(DRAFT_MAX_OUTPUT_TOKENS).toBe(800);
    expect(DRAFT_MAX_RETRIES).toBe(0);
    expect(DRAFT_MAX_DURATION_MS).toBe(30_000);
    expect(providerSource).toContain("maxOutputTokens: DRAFT_MAX_OUTPUT_TOKENS");
    expect(providerSource).toContain("maxRetries: DRAFT_MAX_RETRIES");
    expect(providerSource).toContain("timeout: { totalMs: DRAFT_MAX_DURATION_MS }");
  });

  it("uses an explicit truthy environment value as an emergency stop", () => {
    expect(isDraftAssistDisabled("true")).toBe(true);
    expect(isDraftAssistDisabled(" TRUE ")).toBe(true);
    expect(isDraftAssistDisabled(undefined)).toBe(false);
    expect(isDraftAssistDisabled("false")).toBe(false);
    expect(isDraftAssistDisabled("1")).toBe(false);
  });

  it("normalises whitespace and caps input length", () => {
    expect(cleanInput("  I \n can \t help  ")).toBe("I can help");
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
