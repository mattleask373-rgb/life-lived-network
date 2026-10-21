import { describe, expect, it } from "vitest";

import { buildPlaceIndex, type Place } from "./places";
import { buildGatedPlaceSitemapPaths } from "./place-sitemap-candidates";
import type { WorldEntry } from "./world-data";

const place: Place = {
  id: "place-1",
  parent_id: null,
  kind: "city",
  name: "Example Place",
  slug: "example-place",
  country_code: "GB",
  timezone: "Europe/London",
  currency: "GBP",
  lat: null,
  lng: null,
  blurb: "A factual locality description.",
};

function service(id: string, overrides: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id,
    placeId: place.id,
    layer: "work",
    kind: "service",
    serviceCategory: "cleaning",
    title: "Cleaning service " + id,
    place: place.name,
    neighbourhood: place.name,
    x: 1,
    y: 1,
    when: "Times not stated",
    band: "today",
    minutes: 60,
    cost: 0,
    currency: "GBP",
    summary: "A real service listing.",
    details: [],
    host: "A local provider",
    verified: true,
    quality: "verified",
    social: "quiet",
    outdoors: false,
    origin: "resident",
    ...overrides,
  };
}

describe("gated locality and service sitemap candidates", () => {
  it("includes only indexable pages for the exact place scope", () => {
    const index = buildPlaceIndex([place]);
    const eligibleLocality = [
      service("one"),
      service("two"),
      service("three"),
    ];
    const result = buildGatedPlaceSitemapPaths(index, eligibleLocality, Date.parse("2026-10-21T12:00:00Z"));
    expect(result.localityPaths).toEqual(["/gb/example-place"]);
    expect(result.servicePaths).toEqual(["/gb/example-place/cleaning"]);
  });

  it("does not promote child-place records onto a parent page", () => {
    const child: Place = {
      ...place,
      id: "place-child",
      parent_id: place.id,
      kind: "town",
      name: "Child Place",
      slug: "child-place",
    };
    const index = buildPlaceIndex([place, child]);
    const result = buildGatedPlaceSitemapPaths(
      index,
      [service("one", { placeId: child.id }), service("two", { placeId: child.id }), service("three", { placeId: child.id })],
      Date.parse("2026-10-21T12:00:00Z"),
    );
    expect(result.localityPaths).toEqual(["/gb/child-place"]);
    expect(result.localityPaths).not.toContain("/gb/example-place");
  });

  it("excludes demos, stale records and imported rows without provenance", () => {
    const index = buildPlaceIndex([place]);
    const rows = [
      service("demo", { demonstration: true }),
      service("stale", { quality: "may have changed" }),
      service("source", { origin: "source", sourceName: "Outside source" }),
    ];
    const result = buildGatedPlaceSitemapPaths(index, rows, Date.parse("2026-10-21T12:00:00Z"));
    expect(result.localityPaths).toEqual([]);
    expect(result.servicePaths).toEqual([]);
  });

  it("returns stable de-duplicated paths", () => {
    const index = buildPlaceIndex([place]);
    const rows = [service("one"), service("two"), service("three")];
    const first = buildGatedPlaceSitemapPaths(index, rows);
    const second = buildGatedPlaceSitemapPaths(index, [...rows, ...rows]);
    expect(first.localityPaths).toEqual(second.localityPaths);
    expect(first.servicePaths).toEqual(second.servicePaths);
  });
});
