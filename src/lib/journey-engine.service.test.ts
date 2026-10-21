import { describe, expect, it } from "vitest";

import { planJourney, whatIsPossible } from "./journey-engine";
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

  it("does not schedule a service offer into a journey window", () => {
    const service = entry({
      id: "service-cleaning",
      kind: "service",
      title: "Cleaning service",
      band: "by_arrangement",
      when: "By arrangement — timing not confirmed",
      minutes: 0,
    });
    const plan = planJourney(
      {
        days: 1,
        budget: 100,
        interests: ["experience"],
        wantsPaidWork: false,
        social: "friendly",
      },
      [service],
    );

    expect(plan.steps.some((step) => step.entry.kind === "service")).toBe(false);
  });
});
