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
    summary: "A test record; not live inventory.",
    details: [],
    host: "Test host",
    verified: true,
    quality: "verified",
    social: "quiet",
    outdoors: false,
    origin: "resident",
    ...overrides,
  };
}

describe("gated place sitemap candidate builder", () => {
  it("emits locality and service URLs only when both shared gates return INDEXABLE", () => {
    const paths = buildGatedPlaceSitemapPaths(
      buildPlaceIndex([place]),
      [service("one"), service("two"), service("three")],
      Date.parse("2026-10-19T12:00:00Z"),
    );
    expect(paths).toEqual(["/gb/example-place", "/gb/example-place/cleaning"]);
  });

  it("excludes thin, demo-only and stale candidates", () => {
    const index = buildPlaceIndex([place]);
    expect(buildGatedPlaceSitemapPaths(index, [service("one"), service("two")])).toEqual([]);

    expect(
      buildGatedPlaceSitemapPaths(index, [
        service("d1", { demonstration: true }),
        service("d2", { demonstration: true }),
        service("d3", { demonstration: true }),
      ]),
    ).toEqual([]);

    expect(
      buildGatedPlaceSitemapPaths(index, [
        service("one"),
        service("two"),
        service("three", { quality: "may have changed" }),
      ]),
    ).toEqual([]);
  });

  it("excludes invalid canonical place segments", () => {
    const invalidPlace = { ...place, country_code: "AUS" };
    const paths = buildGatedPlaceSitemapPaths(buildPlaceIndex([invalidPlace]), [
      service("one"),
      service("two"),
      service("three"),
    ]);
    expect(paths).toEqual([]);
  });
});
