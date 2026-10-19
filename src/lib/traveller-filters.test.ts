import { describe, expect, it } from "vitest";

import { applyTravellerFilters, matchesTravellerFilter } from "./traveller-filters";
import type { WorldEntry } from "./world-data";

const NOW = Date.parse("2026-10-19T12:00:00Z");

function entry(partial: Partial<WorldEntry>): WorldEntry {
  return {
    id: partial.id ?? "e1",
    layer: "experience",
    title: "Something",
    place: "Somewhere",
    neighbourhood: "Centre",
    x: 50,
    y: 50,
    when: "Anytime",
    band: "today",
    minutes: 60,
    cost: 10,
    summary: "",
    details: [],
    host: "A person",
    verified: false,
    social: "friendly",
    outdoors: false,
    ...partial,
  };
}

describe("matchesTravellerFilter", () => {
  it("free means exactly zero cost, not negative", () => {
    expect(matchesTravellerFilter(entry({ cost: 0 }), "free", NOW)).toBe(true);
    expect(matchesTravellerFilter(entry({ cost: 5 }), "free", NOW)).toBe(false);
    expect(matchesTravellerFilter(entry({ cost: -20 }), "free", NOW)).toBe(false);
  });

  it("paid means the entry pays the person (negative cost)", () => {
    expect(matchesTravellerFilter(entry({ cost: -15 }), "paid", NOW)).toBe(true);
    expect(matchesTravellerFilter(entry({ cost: 0 }), "paid", NOW)).toBe(false);
  });

  it("this week requires a real upcoming date within seven days", () => {
    const soon = entry({ startsAt: "2026-10-21T18:00:00Z" });
    const later = entry({ startsAt: "2026-11-15T18:00:00Z" });
    const undated = entry({ startsAt: null });
    const cancelled = entry({ startsAt: "2026-10-21T18:00:00Z", cancellation: "cancelled" });
    expect(matchesTravellerFilter(soon, "this-week", NOW)).toBe(true);
    expect(matchesTravellerFilter(later, "this-week", NOW)).toBe(false);
    expect(matchesTravellerFilter(undated, "this-week", NOW)).toBe(false);
    expect(matchesTravellerFilter(cancelled, "this-week", NOW)).toBe(false);
  });

  it("an event that started moments ago still counts as this week", () => {
    const justStarted = entry({ startsAt: "2026-10-19T11:30:00Z" });
    expect(matchesTravellerFilter(justStarted, "this-week", NOW)).toBe(true);
  });

  it("short means two hours or less, and never zero minutes", () => {
    expect(matchesTravellerFilter(entry({ minutes: 90 }), "short", NOW)).toBe(true);
    expect(matchesTravellerFilter(entry({ minutes: 120 }), "short", NOW)).toBe(true);
    expect(matchesTravellerFilter(entry({ minutes: 180 }), "short", NOW)).toBe(false);
    expect(matchesTravellerFilter(entry({ minutes: 0 }), "short", NOW)).toBe(false);
  });
});

describe("applyTravellerFilters", () => {
  it("returns everything when no filter is active", () => {
    const list = [entry({ id: "a" }), entry({ id: "b" })];
    expect(applyTravellerFilters(list, [], NOW)).toHaveLength(2);
  });

  it("applies active filters together, not as alternatives", () => {
    const freeAndShort = entry({ id: "a", cost: 0, minutes: 45 });
    const freeButLong = entry({ id: "b", cost: 0, minutes: 300 });
    const shortButPaid = entry({ id: "c", cost: 12, minutes: 45 });
    const result = applyTravellerFilters(
      [freeAndShort, freeButLong, shortButPaid],
      ["free", "short"],
      NOW,
    );
    expect(result.map((e) => e.id)).toEqual(["a"]);
  });
});
