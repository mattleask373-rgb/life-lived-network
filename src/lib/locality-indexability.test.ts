import { describe, expect, it } from "vitest";

import { evaluateLocalityPage } from "./locality-indexability";
import type { WorldEntry } from "./world-data";

const place = {
  id: "place-1",
  name: "Example Place",
  slug: "example-place",
  countrySegment: "gb",
  blurb: "A factual locality description.",
};

function entry(overrides: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: "entry-1",
    placeId: place.id,
    layer: "work",
    kind: "service",
    serviceCategory: "cleaning",
    title: "Cleaning service",
    place: place.name,
    neighbourhood: place.name,
    x: 1,
    y: 1,
    when: "Times not stated",
    band: "today",
    minutes: 60,
    cost: 0,
    currency: "GBP",
    summary: "Test fixture only; not live inventory.",
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

describe("shared locality indexability gate", () => {
  it("allows only a fully evidenced locality with at least three real records", () => {
    const result = evaluateLocalityPage({
      place,
      entries: [entry({ id: "one" }), entry({ id: "two" }), entry({ id: "three" })],
      now: Date.parse("2026-10-19T12:00:00Z"),
    });
    expect(result).toEqual({ status: "INDEXABLE", reasons: [], sitemapEligible: true });
  });

  it("keeps thin and demonstration-only pages out of the sitemap", () => {
    const thin = evaluateLocalityPage({
      place,
      entries: [entry({ id: "one" }), entry({ id: "two" })],
    });
    expect(thin.status).toBe("NOINDEX");
    expect(thin.sitemapEligible).toBe(false);

    const demo = evaluateLocalityPage({
      place,
      entries: [
        entry({ id: "d1", demonstration: true }),
        entry({ id: "d2", demonstration: true }),
        entry({ id: "d3", demonstration: true }),
      ],
    });
    expect(demo.status).toBe("NOINDEX");
    expect(demo.sitemapEligible).toBe(false);
    expect(demo.reasons).toContain("demonstration_only");
  });

  it("fails closed for stale records, missing source provenance and invalid country codes", () => {
    const stale = evaluateLocalityPage({
      place,
      entries: [
        entry({ id: "one" }),
        entry({ id: "two" }),
        entry({ id: "three", quality: "may have changed" }),
      ],
    });
    expect(stale.sitemapEligible).toBe(false);
    expect(stale.reasons).toContain("stale_or_expired");

    const badSource = evaluateLocalityPage({
      place,
      entries: [
        entry({ id: "one" }),
        entry({ id: "two" }),
        entry({ id: "three", origin: "source", sourceName: undefined, sourceUrl: undefined }),
      ],
    });
    expect(badSource.sitemapEligible).toBe(false);
    expect(badSource.reasons).toContain("missing_provenance");

    const invalidPlace = evaluateLocalityPage({
      place: { ...place, countrySegment: "AUS" },
      entries: [entry({ id: "one" }), entry({ id: "two" }), entry({ id: "three" })],
    });
    expect(invalidPlace.sitemapEligible).toBe(false);
    expect(invalidPlace.reasons).toContain("invalid_place");
  });
});
