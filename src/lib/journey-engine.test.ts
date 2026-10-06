import { describe, expect, it } from "vitest";

import {
  isJourneyEligible,
  journeyEligibleEntries,
  planJourney,
  whatIsPossible,
  type JourneyBrief,
  type HoursBrief,
} from "./journey-engine";
import type { WorldEntry } from "./world-data";

function entry(overrides: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: "entry-1",
    layer: "experience",
    title: "A real thing",
    place: "Kings Heath",
    neighbourhood: "Kings Heath",
    x: 50,
    y: 50,
    lat: 52.43,
    lng: -1.89,
    when: "Today",
    band: "today",
    minutes: 60,
    cost: 0,
    summary: "A real possibility",
    details: [],
    host: "Posted by someone here",
    verified: true,
    social: "friendly",
    outdoors: false,
    ...overrides,
  };
}

const journeyBrief: JourneyBrief = {
  days: 3,
  budget: 30,
  interests: ["experience"],
  wantsPaidWork: false,
  social: "friendly",
};

const hoursBrief: HoursBrief = {
  minutes: 120,
  spend: 30,
  outdoors: false,
  social: "friendly",
  interests: ["experience"],
};

describe("journey eligibility", () => {
  it("rejects expired and cancelled records", () => {
    expect(isJourneyEligible(entry({ quality: "expired" }))).toBe(false);
    expect(isJourneyEligible(entry({ cancellation: "cancelled" }))).toBe(false);
    expect(isJourneyEligible(entry({ cancellation: "postponed" }))).toBe(false);
  });

  it("rejects activities whose recorded end instant has passed", () => {
    const now = Date.parse("2026-10-06T12:00:00Z");

    expect(
      isJourneyEligible(
        entry({ endsAt: "2026-10-06T11:59:59Z" }),
        now,
      ),
    ).toBe(false);

    expect(
      isJourneyEligible(
        entry({ endsAt: "2026-10-06T12:00:01Z" }),
        now,
      ),
    ).toBe(true);
  });

  it("preserves ordinary records without an end instant", () => {
    expect(isJourneyEligible(entry())).toBe(true);
    expect(journeyEligibleEntries([
      entry({ id: "good" }),
      entry({ id: "expired", quality: "expired" }),
      entry({ id: "cancelled", cancellation: "cancelled" }),
    ])).toHaveLength(1);
  });

  it("never puts stale or cancelled records into a journey", () => {
    const world = [
      entry({ id: "expired", band: "today", quality: "expired" }),
      entry({ id: "cancelled", band: "tonight", cancellation: "cancelled" }),
      entry({ id: "live-today", band: "today" }),
      entry({ id: "live-tonight", band: "tonight", layer: "music" }),
    ];

    const journeys = planJourney(journeyBrief, world);
    const ids = journeys.flatMap((journey) => journey.steps.map((step) => step.entry.id));

    expect(ids).toContain("live-today");
    expect(ids).toContain("live-tonight");
    expect(ids).not.toContain("expired");
    expect(ids).not.toContain("cancelled");
  });

  it("keeps the quick-possibility helper on the same eligibility boundary", () => {
    const world = [
      entry({ id: "good" }),
      entry({ id: "expired", quality: "expired" }),
      entry({ id: "cancelled", cancellation: "cancelled" }),
    ];

    const possible = whatIsPossible(hoursBrief, world);
    expect(possible.map((item) => item.id)).toEqual(["good"]);
  });
});
