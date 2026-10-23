import { describe, expect, it } from "vitest";

import { isJourneyCandidate, whatIsPossible } from "./journey-engine";
import type { WorldEntry } from "./world-data";

function entry(overrides: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: "entry-1",
    layer: "experience",
    title: "A local activity",
    place: "Birmingham",
    neighbourhood: "Birmingham",
    x: 50,
    y: 50,
    when: "Today",
    band: "today",
    minutes: 60,
    cost: 0,
    summary: "Something a person can actually do.",
    details: [],
    host: "Posted by someone here",
    verified: false,
    social: "friendly",
    outdoors: false,
    ...overrides,
  };
}

describe("service offers stay out of personal activity planning", () => {
  it("does not suggest a commercial service as an activity to fill free hours", () => {
    const service = entry({
      id: "service-cleaning",
      kind: "service",
      title: "Cleaning service",
      band: "by_arrangement",
      when: "By arrangement — timing not confirmed",
      minutes: 0,
    });
    const activity = entry({ id: "community-music", kind: "event", title: "Community music" });
    const results = whatIsPossible(
      {
        minutes: 180,
        spend: 30,
        outdoors: false,
        social: "friendly",
        interests: [],
      },
      [service, activity],
    );

    expect(results.map((result) => result.id)).toEqual(["community-music"]);
  });

  it("does not treat a service offer as a journey candidate even if it has a time band", () => {
    const service = entry({
      id: "service-cleaning",
      kind: "service",
      title: "Cleaning service",
      band: "today",
      when: "Today",
      minutes: 60,
    });

    expect(isJourneyCandidate(service, "today", new Set())).toBe(false);
  });

  it("continues to allow an ordinary activity as a journey candidate", () => {
    const activity = entry({ id: "community-music", kind: "event" });

    expect(isJourneyCandidate(activity, "today", new Set())).toBe(true);
    expect(isJourneyCandidate(activity, "today", new Set(["community-music"]))).toBe(false);
  });
});
