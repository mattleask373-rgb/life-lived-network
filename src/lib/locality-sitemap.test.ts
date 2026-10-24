import { describe, expect, it } from "vitest";

import { buildPlaceIndex, type Place } from "./places";
import {
  indexableLocalityPaths,
  LOCALITY_SITEMAP_LISTING_SCAN_LIMIT,
  readBoundedSitemapPages,
  SitemapSourceLimitError,
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
  return Array.from({ length: count }, (_, index) => ({
    id: `${placeId}-${demonstration ? "demo" : "real"}-${index}`,
    place_id: placeId,
    demonstration,
    publiclyEligible: true,
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

  it("fails closed when public eligibility evidence is absent", () => {
    const unknownRows = rowsFor("city", 3).map((row) => {
      const unknown = { ...row } as Record<string, unknown>;
      delete unknown.publiclyEligible;
      return unknown as unknown as PublicListingSitemapRow;
    });
    expect(indexableLocalityPaths(geography, unknownRows)).not.toContain("/gb/birmingham");
  });

  it("does not backfill an ineligible raw row from after the first 60 page slots", () => {
    const hidden = rowsFor("city", 60).map((row) => ({ ...row, publiclyEligible: false }));
    const laterEligible = rowsFor("city", 3);
    expect(indexableLocalityPaths(geography, [...hidden, ...laterEligible])).not.toContain(
      "/gb/birmingham",
    );
  });

  it("fails closed when a bounded source scan may be incomplete", () => {
    expect(indexableLocalityPaths(geography, rowsFor("city", 3), { complete: false })).toEqual([]);
  });

  it("fails closed for over-wide subtrees instead of using unrelated global rows", () => {
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
    const paths = indexableLocalityPaths(wideIndex, rowsFor("other-city", 3));

    expect(paths).toContain("/gb/other-city");
    expect(paths).toContain("/gb/other-root");
    expect(paths).not.toContain("/gb/wide-area");
  });

  it("never builds a path from an invalid slug", () => {
    const invalid = buildPlaceIndex([
      place({ id: "bad", name: "Bad", slug: "../bad", kind: "city" }),
    ]);
    expect(indexableLocalityPaths(invalid, rowsFor("bad", 3))).toEqual([]);
  });

  it("does not emit duplicate paths when several public records share a locality", () => {
    const repeatedListings = [...rowsFor("city", 3), ...rowsFor("city", 3)];
    expect(indexableLocalityPaths(geography, repeatedListings)).toEqual([
      "/gb/birmingham",
      "/gb/west-midlands",
    ]);
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

describe("bounded sitemap source paging", () => {
  interface Row {
    id: string;
    value: number;
  }

  it("reads adjacent ranges using an exact total count", async () => {
    const source: Row[] = Array.from({ length: 2501 }, (_, index) => ({
      id: String(index),
      value: index,
    }));
    const rangeCalls: Array<[number, number]> = [];
    let countCalls = 0;
    const rows = await readBoundedSitemapPages(
      3000,
      1000,
      async () => {
        countCalls += 1;
        return source.length;
      },
      async (from, to) => {
        rangeCalls.push([from, to]);
        return { rows: source.slice(from, to + 1) };
      },
      (row) => row.id,
    );

    expect(rows).toEqual(source);
    expect(countCalls).toBe(2);
    expect(rangeCalls).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2500],
    ]);
  });

  it("fails closed when the exact count reaches the cap", async () => {
    const calls: Array<[number, number]> = [];
    await expect(
      readBoundedSitemapPages(
        5,
        2,
        async () => 5,
        async (from, to) => {
          calls.push([from, to]);
          return { rows: Array.from({ length: to - from + 1 }, (_, i) => ({ id: String(from + i), value: from + i })) };
        },
        (row) => row.id,
      ),
    ).rejects.toBeInstanceOf(SitemapSourceLimitError);
    expect(calls).toEqual([]);
  });

  it("fails closed when a requested page is shorter than exact-count evidence", async () => {
    await expect(
      readBoundedSitemapPages(
        10,
        3,
        async () => 4,
        async (from, to) => ({ rows: Array.from({ length: Math.max(0, to - from) }, (_, i) => ({ id: String(from + i), value: from + i })) }),
        (row) => row.id,
      ),
    ).rejects.toThrow("short or invalid page");
  });

  it("fails closed on duplicate IDs", async () => {
    await expect(
      readBoundedSitemapPages(
        10,
        3,
        async () => 2,
        async () => ({ rows: [{ id: "same", value: 1 }, { id: "same", value: 2 }] }),
        (row) => row.id,
      ),
    ).rejects.toThrow("duplicate row ID");
  });

  it("fails closed when the source count changes during the read", async () => {
    let countCalls = 0;
    await expect(
      readBoundedSitemapPages(
        10,
        3,
        async () => (++countCalls === 1 ? 2 : 3),
        async () => ({ rows: [{ id: "1", value: 1 }, { id: "2", value: 2 }] }),
        (row) => row.id,
      ),
    ).rejects.toThrow("count changed");
  });

  it("rejects missing counts and invalid bounds", async () => {
    await expect(
      readBoundedSitemapPages(10, 3, async () => null, async () => ({ rows: [] }), (row) => row.id),
    ).rejects.toThrow("count is missing");
    await expect(readBoundedSitemapPages(0, 10, async () => 0, async () => ({ rows: [] }), (row) => row.id)).rejects.toThrow(RangeError);
    await expect(readBoundedSitemapPages(10, 0, async () => 0, async () => ({ rows: [] }), (row) => row.id)).rejects.toThrow(RangeError);
  });
});
