import { describe, expect, it } from "vitest";

import { buildPlaceIndex, type Place } from "./places";
import { indexableServicePaths } from "./service-sitemap";
import type { PublicListingSitemapRow } from "./locality-sitemap";
import type { WorldEntry } from "./world-data";

function place(overrides: Partial<Place> & Pick<Place, "id" | "name" | "slug" | "kind">): Place {
  return {
    parent_id: null,
    country_code: "GB",
    timezone: "Europe/London",
    currency: "GBP",
    lat: null,
    lng: null,
    blurb: "",
    ...overrides,
  };
}

const index = buildPlaceIndex([
  place({ id: "region", name: "West Midlands", slug: "west-midlands", kind: "region" }),
  place({ id: "city", name: "Birmingham", slug: "birmingham", kind: "city", parent_id: "region" }),
]);

function entry(overrides: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: "cleaner-1",
    placeId: "city",
    layer: "experience",
    title: "Holiday rental cleaner",
    place: "Birmingham",
    neighbourhood: "Birmingham",
    x: 50,
    y: 50,
    when: "As agreed",
    band: "today",
    minutes: 60,
    cost: 0,
    summary: "Cleaning between guest stays",
    details: [],
    host: "Posted by someone here",
    verified: false,
    social: "friendly",
    outdoors: false,
    kind: "service",
    skills: ["cleaning", "holiday rental"],
    quality: "unverified",
    ...overrides,
  };
}

function rowsFor(entries: WorldEntry[]): PublicListingSitemapRow[] {
  return entries.map((value) => ({
    id: value.id,
    place_id: "city",
    demonstration: value.demonstration ?? false,
    sourceLifecycleEligible: true,
  }));
}

describe("service sitemap indexability", () => {
  it("includes canonical service-in-place paths when a genuine service exists", () => {
    const cleaner = entry();
    const paths = indexableServicePaths(
      index,
      rowsFor([cleaner]),
      new Map([[cleaner.id, cleaner]]),
    );
    expect(paths).toContain("/gb/birmingham/cleaning");
    expect(paths).toContain("/gb/west-midlands/cleaning");
  });

  it("does not publish a service path from imported rows without lifecycle proof", () => {
    const imported = entry({
      id: "imported-cleaner",
      origin: "source",
      sourceName: "Outside source",
      sourceUrl: "https://source.example/listing/1",
    });
    const rows = rowsFor([imported]).map((row) => ({
      ...row,
      sourceLifecycleEligible: false,
    }));
    expect(
      indexableServicePaths(index, rows, new Map([[imported.id, imported]])),
    ).toEqual([]);
  });

  it("excludes demonstration-only services", () => {
    const demo = entry({ id: "demo-cleaner", demonstration: true });
    expect(indexableServicePaths(index, rowsFor([demo]), new Map([[demo.id, demo]]))).toEqual([]);
  });

  it("does not infer a service category from an unrelated record", () => {
    const unrelated = entry({
      id: "x",
      kind: "event",
      title: "An evening together",
      summary: "Music and chat",
      skills: [],
    });
    expect(
      indexableServicePaths(index, rowsFor([unrelated]), new Map([[unrelated.id, unrelated]])),
    ).toEqual([]);
  });

  it("uses only the first 60 records the service page renders", () => {
    const demos = Array.from({ length: 60 }, (_, i) =>
      entry({ id: `demo-${i}`, demonstration: true }),
    );
    const cleaner = entry({ id: "after-first-page" });
    const rows = [...rowsFor(demos), ...rowsFor([cleaner])];
    const entries = new Map([...demos, cleaner].map((value) => [value.id, value]));
    expect(indexableServicePaths(index, rows, entries)).not.toContain("/gb/birmingham/cleaning");
  });

  it("fails closed when the bounded source scan is incomplete", () => {
    const cleaner = entry();
    expect(
      indexableServicePaths(index, rowsFor([cleaner]), new Map([[cleaner.id, cleaner]]), {
        complete: false,
      }),
    ).toEqual([]);
  });
});
