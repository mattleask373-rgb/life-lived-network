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

  it("does not derive wide-area service URLs from an unrelated global page", () => {
    const wideIndex = buildPlaceIndex([
      place({ id: "wide", name: "Wide area", slug: "wide-area", kind: "region" }),
      ...Array.from({ length: 400 }, (_, index) =>
        place({
          id: `wide-child-${index}`,
          name: `Wide child ${index}`,
          slug: `wide-child-${index}`,
          kind: "town",
          parent_id: "wide",
        }),
      ),
      place({ id: "other-root", name: "Other root", slug: "other-root", kind: "region" }),
      place({
        id: "other-city",
        name: "Other city",
        slug: "other-city",
        kind: "city",
        parent_id: "other-root",
      }),
    ]);
    const cleaner = entry({ id: "other-cleaner", placeId: "other-city" });
    const rows: PublicListingSitemapRow[] = [
      { id: cleaner.id, place_id: "other-city", demonstration: false },
    ];
    const paths = indexableServicePaths(wideIndex, rows, new Map([[cleaner.id, cleaner]]));

    expect(paths).toContain("/gb/other-city/cleaning");
    expect(paths).toContain("/gb/other-root/cleaning");
    expect(paths).not.toContain("/gb/wide-area/cleaning");
  });

  it("does not backfill ineligible raw rows from after the first 60 page slots", () => {
    const hidden = Array.from({ length: 60 }, (_, index) => entry({ id: `held-${index}` }));
    const laterEligible = entry({ id: "eligible-after-first-page" });
    const rows: PublicListingSitemapRow[] = [
      ...hidden.map((value) => ({
        id: value.id,
        place_id: "city",
        demonstration: false,
        publiclyEligible: false,
      })),
      { id: laterEligible.id, place_id: "city", demonstration: false, publiclyEligible: true },
    ];
    const entries = new Map([...hidden, laterEligible].map((value) => [value.id, value]));

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
