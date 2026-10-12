import { describe, expect, it } from "vitest";

import { INTENTS, doSomethingToday, intentById, whyNot, type Intent } from "./intents";
import type { WorldEntry } from "./world-data";

function makeEntry(partial: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: "entry-1",
    title: "Test Entry",
    blurb: "A real test entry",
    layer: "community",
    band: "today",
    quality: "confirmed",
    verified: true,
    cost: 0,
    outdoors: false,
    give: false,
    x: 0,
    y: 0,
    ...partial,
  };
}

describe("intent lookups and metadata", () => {
  it("resolves known intents by id", () => {
    expect(intentById("meet")?.label).toBe("Meet people");
    expect(intentById("nature")?.outdoors).toBe(true);
    expect(intentById("free")?.free).toBe(true);
    expect(intentById("work")?.pays).toBe(true);
  });

  it("returns undefined for unknown intent id", () => {
    expect(intentById("non-existent")).toBeUndefined();
  });
});

describe("doSomethingToday in quiet localities", () => {
  const meetIntent = intentById("meet")!;

  it("returns an empty array when world is empty", () => {
    expect(doSomethingToday([], meetIntent)).toEqual([]);
  });

  it("never includes expired entries", () => {
    const expired = makeEntry({ id: "e1", layer: "community", quality: "expired" });
    expect(doSomethingToday([expired], meetIntent)).toEqual([]);
  });
});

describe("doSomethingToday ranking and constraints", () => {
  const natureIntent = intentById("nature")!;

  it("scores matching layers and outdoors flags ahead of mismatches", () => {
    const outdoorsNature = makeEntry({
      id: "e1",
      layer: "nature",
      outdoors: true,
      title: "Woodland walk",
    });
    const indoorsCommunity = makeEntry({
      id: "e2",
      layer: "community",
      outdoors: false,
      title: "Hall meeting",
    });

    const results = doSomethingToday([indoorsCommunity, outdoorsNature], natureIntent);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("e1");
  });

  it("enforces layer diversity by returning at most one entry per layer", () => {
    const meetIntent = intentById("meet")!; // layers: people, food, community
    const food1 = makeEntry({ id: "f1", layer: "food", title: "Cafe 1" });
    const food2 = makeEntry({ id: "f2", layer: "food", title: "Cafe 2" });
    const community1 = makeEntry({ id: "c1", layer: "community", title: "Group 1" });

    const results = doSomethingToday([food1, food2, community1], meetIntent);
    const layers = results.map((r) => r.layer);
    expect(new Set(layers).size).toBe(layers.length);
    expect(layers).toContain("food");
    expect(layers).toContain("community");
  });

  it("caps results at 3 entries", () => {
    const anyIntent: Intent = {
      id: "all",
      label: "All",
      blurb: "All",
      layers: ["art", "food", "music", "nature"],
    };
    const entries = [
      makeEntry({ id: "1", layer: "art" }),
      makeEntry({ id: "2", layer: "food" }),
      makeEntry({ id: "3", layer: "music" }),
      makeEntry({ id: "4", layer: "nature" }),
    ];
    const results = doSomethingToday(entries, anyIntent);
    expect(results.length).toBe(3);
  });
});

describe("whyNot recommendation boundary", () => {
  it("returns undefined for an empty world", () => {
    expect(whyNot([], [])).toBeUndefined();
  });

  it("excludes expired entries and entries over 20 cost", () => {
    const expensive = makeEntry({ id: "e1", cost: 25, layer: "music" });
    const expired = makeEntry({ id: "e2", cost: 10, layer: "art", quality: "expired" });
    const alreadySaved = makeEntry({ id: "e3", cost: 0, layer: "food" });

    expect(whyNot([expensive, expired, alreadySaved], ["e3"])).toBeUndefined();
  });

  it("prioritizes layers the user has not already saved", () => {
    const savedMusic = makeEntry({ id: "s1", cost: 5, layer: "music", title: "Concert" });
    const moreMusic = makeEntry({ id: "m1", cost: 5, layer: "music", title: "Gig" });
    const newArt = makeEntry({ id: "a1", cost: 5, layer: "art", title: "Exhibition" });

    const choice = whyNot([savedMusic, moreMusic, newArt], ["s1"]);
    expect(choice?.layer).toBe("art");
  });

  it("cycles deterministically through candidates with nudge offset", () => {
    const e1 = makeEntry({ id: "a", title: "Alpha", cost: 0, layer: "art" });
    const e2 = makeEntry({ id: "b", title: "Beta", cost: 0, layer: "food" });

    const first = whyNot([e1, e2], [], 0);
    const second = whyNot([e1, e2], [], 1);
    const looped = whyNot([e1, e2], [], 2);

    expect(first?.id).toBe("a");
    expect(second?.id).toBe("b");
    expect(looped?.id).toBe("a");
  });
});
