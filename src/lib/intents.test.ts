import { describe, expect, it } from "vitest";
import { doSomethingToday, INTENTS, whyNot } from "./intents";
import type { WorldEntry } from "./world-data";

const base = (overrides: Partial<WorldEntry> = {}): WorldEntry => ({
  id: "t1",
  layer: "work",
  title: "Garden help",
  place: "Newtown",
  neighbourhood: "Newtown",
  x: 40,
  y: 50,
  when: "Today",
  band: "today",
  minutes: 90,
  cost: 0,
  summary: "Weeding and planting",
  details: [],
  host: "Local",
  verified: true,
  social: "friendly",
  outdoors: true,
  quality: "verified",
  ...overrides,
});

describe("doSomethingToday (groundedMatch integration)", () => {
  it("returns empty array when nothing eligible", () => {
    expect(doSomethingToday([], INTENTS[0])).toEqual([]);
  });

  it("excludes demonstration and expired records", () => {
    const world = [
      base({ id: "demo", demonstration: true, layer: "community" }),
      base({ id: "old", quality: "expired", layer: "nature" }),
      base({ id: "good", layer: "community", give: "Hands needed" }),
    ];
    const help = INTENTS.find((i) => i.id === "help")!;
    const results = doSomethingToday(world, help);
    expect(results.map((r) => r.id)).toEqual(["good"]);
  });

  it("returns at most three results", () => {
    const world = Array.from({ length: 8 }, (_, i) =>
      base({
        id: `e${i}`,
        layer: (["work", "music", "food", "nature", "art"] as const)[i % 5],
        title: `Entry ${i}`,
        band: "today",
      }),
    );
    const free = INTENTS.find((i) => i.id === "free")!;
    const results = doSomethingToday(world, free);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("prefers variety across layers when possible", () => {
    const world = [
      base({ id: "w1", layer: "work", band: "today" }),
      base({ id: "w2", layer: "work", band: "today" }),
      base({ id: "m1", layer: "music", band: "today" }),
      base({ id: "f1", layer: "food", band: "today" }),
    ];
    const free = INTENTS.find((i) => i.id === "free")!;
    const results = doSomethingToday(world, free);
    const layers = new Set(results.map((r) => r.layer));
    expect(layers.size).toBeGreaterThanOrEqual(Math.min(3, results.length));
  });

  it("maps work intent to paid preference without inventing records", () => {
    const world = [
      base({ id: "paid", layer: "work", cost: -40, band: "today" }),
      base({ id: "free", layer: "work", cost: 0, band: "today" }),
    ];
    const work = INTENTS.find((i) => i.id === "work")!;
    const results = doSomethingToday(world, work);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("paid");
  });
});

describe("whyNot", () => {
  it("skips demonstration and expired", () => {
    const world = [
      base({ id: "demo", demonstration: true, cost: 0 }),
      base({ id: "old", quality: "expired", cost: 0 }),
      base({ id: "ok", cost: 5, layer: "music" }),
    ];
    const pick = whyNot(world, []);
    expect(pick?.id).toBe("ok");
  });
});
