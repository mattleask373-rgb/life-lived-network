import { describe, expect, it } from "vitest";
import { groundedMatch, queryFromIntent, threeHours } from "./grounded-matching";
import type { WorldEntry } from "./world-data";
import { INTENTS } from "./intents";

const base = (overrides: Partial<WorldEntry> = {}): WorldEntry => ({
  id: "t1",
  layer: "work",
  title: "Garden help needed",
  place: "Newtown",
  neighbourhood: "Newtown",
  x: 40,
  y: 50,
  when: "This weekend",
  band: "weekend",
  minutes: 120,
  cost: 0,
  summary: "Help with weeding and planting",
  details: [],
  host: "Local resident",
  verified: true,
  social: "friendly",
  outdoors: true,
  quality: "verified",
  serviceCategory: "gardening",
  ...overrides,
});

describe("groundedMatch", () => {
  it("returns quiet when no current records", () => {
    const outcome = groundedMatch([]);
    expect(outcome.kind).toBe("quiet");
    if (outcome.kind === "quiet") {
      expect(outcome.message).toMatch(/nothing current/i);
      expect(outcome.suggestion).toMatch(/help make something happen/i);
    }
  });

  it("excludes demonstration and expired records", () => {
    const entries = [
      base({ id: "demo", demonstration: true }),
      base({ id: "old", quality: "expired" }),
      base({ id: "good", title: "Real gardening" }),
    ];
    const outcome = groundedMatch(entries, { serviceCategory: "gardening" });
    expect(outcome.kind).toBe("matches");
    if (outcome.kind === "matches") {
      expect(outcome.matches).toHaveLength(1);
      expect(outcome.matches[0]!.entry.id).toBe("good");
    }
  });

  it("prefers exact service category and returns evidence", () => {
    const entries = [
      base({ id: "g1", serviceCategory: "gardening", title: "Gardener available" }),
      base({ id: "b1", serviceCategory: "building", layer: "work", title: "Builder" }),
    ];
    const outcome = groundedMatch(entries, { serviceCategory: "gardening", layers: ["work"] });
    expect(outcome.kind).toBe("matches");
    if (outcome.kind === "matches") {
      expect(outcome.matches[0]!.entry.id).toBe("g1");
      expect(outcome.matches[0]!.evidence.reasons.some((r) => r.includes("gardening"))).toBe(true);
    }
  });

  it("respects free / pays / outdoors preferences", () => {
    const entries = [
      base({ id: "paid", cost: -50, outdoors: false }),
      base({ id: "free-out", cost: 0, outdoors: true }),
    ];
    const outcome = groundedMatch(entries, { free: true, outdoors: true });
    expect(outcome.kind).toBe("matches");
    if (outcome.kind === "matches") {
      expect(outcome.matches[0]!.entry.id).toBe("free-out");
    }
  });
});

describe("queryFromIntent + threeHours", () => {
  it("builds a query from an existing intent", () => {
    const work = INTENTS.find((i) => i.id === "work")!;
    const q = queryFromIntent(work, { serviceCategory: "gardening" });
    expect(q.pays).toBe(true);
    expect(q.layers).toContain("work");
    expect(q.serviceCategory).toBe("gardening");
  });

  it("threeHours returns at most 4 matches or quiet", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      base({ id: `e${i}`, title: `Activity ${i}` }),
    );
    const outcome = threeHours(many, { free: true });
    if (outcome.kind === "matches") {
      expect(outcome.matches.length).toBeLessThanOrEqual(4);
    } else {
      expect(outcome.kind).toBe("quiet");
    }
  });
});
