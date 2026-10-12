import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { contributions, localityQuestions, providerGroups, upcomingEvents } from "./locality";
import type { WorldEntry } from "./world-data";

function entry(over: Partial<WorldEntry>): WorldEntry {
  return {
    id: Math.random().toString(36).slice(2),
    title: "A thing",
    layer: "community",
    place: "Somewhere",
    neighbourhood: "Somewhere",
    when: "Some time",
    minutes: 60,
    cost: 0,
    currency: "GBP",
    lat: 0,
    lng: 0,
    x: 0,
    y: 0,
    quality: "good",
    ...over,
  } as WorldEntry;
}

const NOW = Date.parse("2026-03-01T12:00:00Z");

describe("a locality read as one thing", () => {
  it("puts dated things in order and leaves the past behind", () => {
    const events = upcomingEvents(
      [
        entry({ title: "Later", startsAt: "2026-03-05T19:00:00Z" }),
        entry({ title: "Sooner", startsAt: "2026-03-02T19:00:00Z" }),
        entry({ title: "Last week", startsAt: "2026-02-20T19:00:00Z" }),
        entry({ title: "No date" }),
      ],
      NOW,
    );
    expect(events.map((e) => e.title)).toEqual(["Sooner", "Later"]);
  });

  it("does not offer something the source has called off", () => {
    const events = upcomingEvents(
      [entry({ title: "Off", startsAt: "2026-03-04T19:00:00Z", cancellation: "cancelled" })],
      NOW,
    );
    expect(events).toEqual([]);
  });

  it("gathers services under whoever provides them, named providers first", () => {
    const groups = providerGroups([
      entry({ title: "Loose service", kind: "service", organisation: "" }),
      entry({ title: "Room hire", kind: "service", organisation: "A practice building" }),
      entry({ title: "Therapy", kind: "service", organisation: "A practice building" }),
      entry({ title: "Not a service" }),
    ]);
    expect(groups[0]?.organisation).toBe("A practice building");
    expect(groups[0]?.entries.map((e) => e.title)).toEqual(["Room hire", "Therapy"]);
    expect(groups[1]?.organisation).toBe("");
    expect(groups).toHaveLength(2);
  });

  it("counts offered hours without counting services as gifts", () => {
    const given = contributions([
      entry({ title: "An hour of bike repair", give: "An hour of bike repair" }),
      entry({ title: "Paid service", kind: "service", give: "" }),
    ]);
    expect(given.map((e) => e.title)).toEqual(["An hour of bike repair"]);
  });

  it("answers every question, including with nought", () => {
    const questions = localityQuestions([], 0, NOW);
    expect(questions).toHaveLength(5);
    expect(questions.every((q) => q.count === 0)).toBe(true);
    expect(questions.map((q) => q.id)).toEqual(["happening", "here", "who", "needed", "possible"]);
  });

  it("reports what people asked for from the number given, not from guesses", () => {
    const questions = localityQuestions([entry({})], 3, NOW);
    expect(questions.find((q) => q.id === "needed")?.count).toBe(3);
    expect(questions.find((q) => q.id === "possible")?.count).toBe(1);
  });

  it("does not turn an unchecked needs read into zero", () => {
    const unavailable = localityQuestions([], { state: "unavailable" }, NOW);
    expect(unavailable.find((q) => q.id === "needed")).toMatchObject({
      count: null,
      unit: "couldn't be checked",
    });
    expect(unavailable.filter((q) => q.id !== "needed").every((q) => q.count === 0)).toBe(true);

    const checking = localityQuestions([entry({})], { state: "checking" }, NOW);
    expect(checking.find((q) => q.id === "needed")).toMatchObject({
      count: null,
      unit: "still checking",
    });
    expect(checking.find((q) => q.id === "possible")?.count).toBe(1);
  });

  it("the public place page does not hard-code zero open needs", () => {
    const src = readFileSync("src/routes/$country.$place.tsx", "utf8");
    expect(src).not.toMatch(/localityQuestions\(entries,\s*0\)/);
    expect(src).toContain("getOpenNeeds");
  });
});
