import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PROPOSED_PRICE_CENTS,
  formatCents,
  interestInput,
  interestSummary,
  scorecard,
  type TrackerRow,
} from "./partner-pilot";
import { PRIVATE_PATHS, PUBLIC_PATHS } from "./seo";

const valid = {
  organisation: "Corner Café",
  contactName: "Sam",
  email: "sam@example.com",
  locality: "Kings Heath",
  orgType: "Independent shop or café",
  challenge: "Mostly word of mouth",
  consent: true,
};

describe("partner interest form", () => {
  it("accepts a complete, consented entry", () => {
    expect(interestInput.safeParse(valid).success).toBe(true);
  });
  it("requires explicit consent", () => {
    expect(interestInput.safeParse({ ...valid, consent: false }).success).toBe(false);
  });
  it("rejects bad email and unknown organisation types", () => {
    expect(interestInput.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(interestInput.safeParse({ ...valid, orgType: "Bank" }).success).toBe(false);
  });
  it("summary says non-binding", () => {
    expect(interestSummary(interestInput.parse(valid))).toMatch(/non-binding/);
  });
});

describe("price hypothesis", () => {
  it("is held in integer cents", () => {
    expect(Number.isInteger(PROPOSED_PRICE_CENTS)).toBe(true);
    expect(formatCents(1900)).toBe("€19.00");
  });
});

describe("scorecard", () => {
  it("counts each signal independently", () => {
    const row = (p: Partial<TrackerRow>): TrackerRow => ({
      id: Math.random().toString(),
      organisation: "x",
      locality: "",
      status: "not contacted",
      interviewed: false,
      strongInterest: false,
      priceCommitment: false,
      notes: "",
      ...p,
    });
    expect(
      scorecard([
        row({}),
        row({ status: "contacted", interviewed: true }),
        row({ status: "replied", strongInterest: true, priceCommitment: true }),
      ]),
    ).toEqual({ contacted: 2, interviews: 1, strongInterest: 1, priceCommitments: 1 });
  });
});

describe("pilot boundaries", () => {
  it("pilot pages are never listed publicly", () => {
    for (const p of ["/partners", "/partner-tracker"]) {
      expect(PRIVATE_PATHS).toContain(p);
      expect(PUBLIC_PATHS).not.toContain(p);
    }
  });
  it("no payments, server calls or backend writes in the pilot code", () => {
    for (const f of [
      "../routes/partners.tsx",
      "../routes/partner-tracker.tsx",
      "partner-pilot.ts",
    ]) {
      const src = readFileSync(join(__dirname, f), "utf8");
      expect(src).not.toMatch(/stripe|checkout|createServerFn|supabase|fetch\(/i);
    }
  });
  it("discloses that the pilot is not launched and nothing is saved", () => {
    const src = readFileSync(join(__dirname, "../routes/partners.tsx"), "utf8");
    expect(src).toMatch(/not yet launched/);
    expect(src).toMatch(/not been sent or saved/);
  });
});
