import { describe, expect, it } from "vitest";

import { buildPlaceIndex, type Place } from "./places";
import {
  indexableLocalityPaths,
  LOCALITY_SITEMAP_LISTING_SCAN_LIMIT,
  type PublicListingSitemapRow,
} from "./locality-sitemap";

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

const geography = buildPlaceIndex([
  place({ id: "region", name: "West Midlands", slug: "west-midlands", kind: "region" }),
  place({ id: "city", name: "Birmingham", slug: "birmingham", kind: "city", parent_id: "region" }),
  place({ id: "quiet", name: "Quiet", slug: "quiet", kind: "town", parent_id: "region" }),
]);

function rowsFor(placeId: string, count: number, demonstration = false): PublicListingSitemapRow[] {
  return Array.from({ length: count }, () => ({
    place_id: placeId,
    demonstration,
    // Input ordering is significant; production passes the listing query's
    // stable order, so the earliest 60 entries are the page that gets rendered.
  }));
}

describe("locality sitemap indexability", () => {
  it("includes a locality and its ancestors only with three real public records", () => {
    const paths = indexableLocalityPaths(geography, rowsFor("city", 3));
    expect(paths).toContain("/gb/birmingham");
    expect(paths).toContain("/gb/west-midlands");
    expect(paths).not.toContain("/gb/quiet");
  });

  it("excludes demo-only supply and mixed pages with fewer than three real records", () => {
    expect(indexableLocalityPaths(geography, rowsFor("city", 8, true))).toEqual([]);
    expect(
      indexableLocalityPaths(geography, [...rowsFor("city", 2), ...rowsFor("quiet", 10, true)]),
    ).not.toContain("/gb/birmingham");
  });

  it("uses only the first 60 records the locality page renders", () => {
    const rows = [...rowsFor("city", 60, true), ...rowsFor("city", 3, false)];
    expect(indexableLocalityPaths(geography, rows)).not.toContain("/gb/birmingham");
  });

  it("fails closed when a bounded source scan may be incomplete", () => {
    expect(indexableLocalityPaths(geography, rowsFor("city", 3), { complete: false })).toEqual([]);
  });

  it("never builds a path from an invalid slug", () => {
    const invalid = buildPlaceIndex([
      place({ id: "bad", name: "Bad", slug: "../bad", kind: "city" }),
    ]);
    expect(indexableLocalityPaths(invalid, rowsFor("bad", 3))).toEqual([]);
  });

  it("does not emit duplicate paths for colliding slugs", () => {
    const colliding = buildPlaceIndex([
      place({ id: "first", name: "First", slug: "same", kind: "city" }),
      place({ id: "second", name: "Second", slug: "same", kind: "town" }),
    ]);
    expect(
      indexableLocalityPaths(colliding, [...rowsFor("first", 3), ...rowsFor("second", 3)]),
    ).toEqual(["/gb/same"]);
  });

  it("does not index localities if the place hierarchy hits its hard cap", () => {
    const capped = buildPlaceIndex(
      Array.from({ length: 5000 }, (_, index) =>
        place({ id: `p${index}`, name: `Place ${index}`, slug: `place-${index}`, kind: "town" }),
      ),
    );
    expect(indexableLocalityPaths(capped, rowsFor("p1", 3))).toEqual([]);
  });

  it("exports a bounded listing scan so the endpoint cannot grow without limit", () => {
    expect(LOCALITY_SITEMAP_LISTING_SCAN_LIMIT).toBe(20_000);
  });
});
