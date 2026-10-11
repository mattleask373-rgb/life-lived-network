import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PROPOSED_PRICE_CENTS,
  dueFollowUps,
  experimentScorecard,
  formatCents,
  interestInput,
  localToday,
  normaliseRow,
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

describe("pipeline", () => {
  it("normalises v1 rows without inventing outcomes and drops junk", () => {
    const r = normaliseRow({
      id: "a",
      organisation: "Café",
      status: "weird",
      followUpDate: "soon",
    });
    expect(r).toMatchObject({
      status: "not contacted",
      priceResponse: "not asked",
      followUpDate: "",
      interviewed: false,
      priceCommitment: false,
    });
    expect(normaliseRow({ id: "b", organisation: " " })).toBeNull();
    expect(normaliseRow("x")).toBeNull();
  });
  it("lists due follow-ups oldest first, skipping declined and future", () => {
    const rows = [
      { id: "1", organisation: "A", followUpDate: "2026-10-12" },
      { id: "2", organisation: "B", followUpDate: "2026-10-01" },
      { id: "3", organisation: "C", followUpDate: "2026-10-05", status: "declined" },
      { id: "4", organisation: "D", followUpDate: "2026-10-09" },
    ].map((x) => normaliseRow(x)!);
    expect(dueFollowUps(rows, "2026-10-11").map((r) => r.id)).toEqual(["2", "4"]);
  });
  it("experiment scorecard counts only recorded responses", () => {
    const rows = [
      { id: "1", organisation: "A", priceResponse: "yes (terms pending)", interviewed: true },
      { id: "2", organisation: "B", priceResponse: "maybe", experiment: "Listing setup service" },
    ].map((x) => normaliseRow(x)!);
    const s = experimentScorecard(rows);
    expect(s[0]).toMatchObject({ organisations: 1, interviews: 1, priceYes: 1 });
    expect(s[1]).toMatchObject({ organisations: 1, priceMaybe: 1, priceYes: 0 });
    expect(experimentScorecard([]).every((e) => e.organisations === 0)).toBe(true);
  });
  it("formats local dates", () => {
    expect(localToday(new Date(2026, 0, 5))).toBe("2026-01-05");
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
