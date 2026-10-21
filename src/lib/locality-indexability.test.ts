import { describe, expect, it } from "vitest";

import { evaluateLocalityIndexability } from "./locality-indexability";
import type { WorldEntry } from "./world-data";

const place = {
  id: "place-1",
  name: "Example Place",
  slug: "example-place",
  countrySegment: "gb",
  blurb: "A factual description of this locality.",
};

function entry(
  overrides: Partial<WorldEntry> & { lastCheckedAt?: string | null } = {},
): WorldEntry & { lastCheckedAt?: string | null } {
  return {
    id: "entry-1",
    placeId: place.id,
    layer: "work",
    kind: "service",
    serviceCategory: "gardening",
    title: "Gardening service",
    place: place.name,
    neighbourhood: place.name,
    x: 1,
    y: 1,
    when: "Times not stated",
    band: "today",
    minutes: 60,
    cost: 0,
    currency: "GBP",
    summary: "A real test record with a meaningful description.",
    details: [],
    host: "Posted by a test resident",
    verified: true,
    quality: "verified",
    social: "quiet",
    outdoors: false,
    origin: "resident",
    ...overrides,
  };
}

const now = Date.parse("2026-10-21T12:00:00Z");
const threeRecords = [entry({ id: "one" }), entry({ id: "two" }), entry({ id: "three" })];

describe("locality indexability", () => {
  it("allows a locality with at least three current, attributable genuine records", () => {
    expect(evaluateLocalityIndexability({ place, entries: threeRecords, now })).toMatchObject({
      status: "INDEXABLE",
      reasons: [],
      sitemapEligible: true,
    });
  });

  it("keeps thin and demonstration-only localities out of search", () => {
    const thin = evaluateLocalityIndexability({
      place,
      entries: [entry({ id: "one" }), entry({ id: "two" })],
      now,
    });
    expect(thin.sitemapEligible).toBe(false);
    expect(thin.reasons).toContain("below_record_threshold");

    const demos = evaluateLocalityIndexability({
      place,
      entries: [
        entry({ id: "d1", demonstration: true }),
        entry({ id: "d2", demonstration: true }),
        entry({ id: "d3", demonstration: true }),
      ],
      now,
    });
    expect(demos.sitemapEligible).toBe(false);
    expect(demos.reasons).toContain("demonstration_only");
  });

  it("fails closed when a displayed genuine record is stale or has no source provenance", () => {
    const stale = evaluateLocalityIndexability({
      place,
      entries: [
        entry({ id: "one" }),
        entry({ id: "two" }),
        entry({ id: "three", quality: "may have changed" }),
      ],
      now,
    });
    expect(stale.sitemapEligible).toBe(false);
    expect(stale.reasons).toContain("stale_or_expired");

    const ungroundedSource = evaluateLocalityIndexability({
      place,
      entries: [
        entry({ id: "one" }),
        entry({ id: "two" }),
        entry({ id: "three", origin: "source", sourceName: undefined, sourceUrl: undefined }),
      ],
      now,
    });
    expect(ungroundedSource.sitemapEligible).toBe(false);
    expect(ungroundedSource.reasons).toContain("missing_provenance");
  });

  it("requires explicit last-checked and verified freshness evidence for imported records", () => {
    const base = [entry({ id: "one" }), entry({ id: "two" })];
    const source = entry({
      id: "external",
      origin: "source",
      sourceName: "Public source",
      sourceUrl: "https://example.org/listing",
      quality: "verified",
    });

    const missingTimestamp = evaluateLocalityIndexability({
      place,
      entries: [...base, source],
      now,
    });
    expect(missingTimestamp.sitemapEligible).toBe(false);
    expect(missingTimestamp.reasons).toContain("stale_or_expired");

    const checkedSource = entry({
      ...source,
      lastCheckedAt: new Date(now - 60_000).toISOString(),
      quality: "recently updated",
    });
    const proven = evaluateLocalityIndexability({
      place,
      entries: [...base, checkedSource],
      now,
    });
    expect(proven.sitemapEligible).toBe(true);
  });

  it("rejects an invalid canonical slug or country segment", () => {
    expect(
      evaluateLocalityIndexability({
        place: { ...place, countrySegment: "AUS" },
        entries: threeRecords,
        now,
      }).sitemapEligible,
    ).toBe(false);
  });
});
