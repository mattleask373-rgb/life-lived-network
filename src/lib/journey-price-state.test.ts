import { describe, expect, it } from "vitest";

import { planJourney, whatIsPossible } from "./journey-engine";
import type { WorldEntry } from "./world-data";

const entry = (overrides: Partial<WorldEntry> = {}): WorldEntry => ({
  id: "entry",
  layer: "experience",
  title: "A real event",
  place: "A place",
  neighbourhood: "A neighbourhood",
  x: 50,
  y: 50,
  when: "Today",
  band: "today",
  minutes: 60,
  cost: 0,
  currency: "USD",
  summary: "Source-backed activity",
  details: [],
  host: "A host",
  verified: true,
  social: "friendly",
  outdoors: false,
  quality: "verified",
  ...overrides,
});

describe("budget and journey price integrity", () => {
  it("keeps unknown prices out of hard budget-filtered activity suggestions", () => {
    const unknown = entry({ id: "unknown", priceKnown: false, currency: "XXX", cost: 0 });
    const known = entry({ id: "known", priceKnown: true, currency: "USD", cost: 5 });
    const result = whatIsPossible(
      {
        minutes: 180,
        spend: 10,
        outdoors: false,
        social: "friendly",
        interests: [],
      },
      [unknown, known],
    );
    expect(result.map((item) => item.id)).toEqual(["known"]);
  });

  it("reports a partial known-price subtotal and does not call it the full total", () => {
    const journey = planJourney(
      {
        days: 1,
        budget: 30,
        interests: ["music"],
        wantsPaidWork: false,
        social: "friendly",
      },
      [
        entry({ id: "one", band: "now", cost: 5, currency: "USD" }),
        entry({ id: "unknown", band: "today", cost: 0, currency: "XXX", priceKnown: false }),
        entry({ id: "three", band: "tonight", cost: 10, currency: "USD" }),
      ],
    )[0];

    expect(journey).toBeDefined();
    expect(journey?.spend).toBe(15);
    expect(journey?.spendCurrency).toBe("USD");
    expect(journey?.spendComplete).toBe(false);
    expect(journey?.steps.find((step) => step.entry.id === "unknown")?.why).toMatch(
      /price not provided/i,
    );
  });

  it("does not add unlike currencies into a false combined total", () => {
    const journey = planJourney(
      {
        days: 1,
        budget: 30,
        interests: ["music"],
        wantsPaidWork: false,
        social: "friendly",
      },
      [
        entry({ id: "one", band: "now", cost: 5, currency: "USD" }),
        entry({ id: "two", band: "today", cost: 10, currency: "EUR" }),
        entry({ id: "three", band: "tonight", cost: 8, currency: "EUR" }),
      ],
    )[0];

    expect(journey).toBeDefined();
    expect(journey?.spendCurrency).toBeNull();
    expect(journey?.spendComplete).toBe(false);
  });
});
