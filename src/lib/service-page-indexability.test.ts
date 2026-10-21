import { describe, expect, it } from "vitest";

import { evaluateServicePageIndexability } from "./service-page-indexability";
import { servicePageListings } from "./service-page";
import type { WorldEntry } from "./world-data";

const place = {
  id: "place-1",
  name: "Example Place",
  slug: "example-place",
  countrySegment: "gb",
  blurb: "A factual description of this locality.",
};

function entry(overrides: Partial<WorldEntry> = {}): WorldEntry {
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
    skills: ["gardening"],
    ...overrides,
  };
}

const now = Date.parse("2026-10-21T12:00:00Z");

describe("service page indexability", () => {
  it("uses the existing route threshold while requiring meaningful current evidence", () => {
    const listings = servicePageListings([entry()], "gardening");
    expect(listings).not.toBeNull();
    if (!listings) return;

    expect(evaluateServicePageIndexability({ place, listings, now })).toMatchObject({
      status: "INDEXABLE",
      reasons: [],
      sitemapEligible: true,
    });
  });

  it("keeps empty and demo-only service pages out of search", () => {
    const empty = servicePageListings([], "gardening")!;
    expect(evaluateServicePageIndexability({ place, listings: empty, now }).sitemapEligible).toBe(
      false,
    );

    const demos = servicePageListings([entry({ demonstration: true })], "gardening")!;
    const decision = evaluateServicePageIndexability({ place, listings: demos, now });
    expect(decision.sitemapEligible).toBe(false);
    expect(decision.reasons).toContain("demonstration_only");
  });

  it("blocks stale records and sourced entries without a usable citation URL", () => {
    const stale = servicePageListings([entry({ quality: "may have changed" })], "gardening")!;
    expect(evaluateServicePageIndexability({ place, listings: stale, now }).sitemapEligible).toBe(
      false,
    );

    const missingSource = servicePageListings([
      entry({ origin: "source", sourceName: "External source", sourceUrl: "javascript:alert(1)" }),
    ], "gardening")!;
    const decision = evaluateServicePageIndexability({ place, listings: missingSource, now });
    expect(decision.sitemapEligible).toBe(false);
    expect(decision.reasons).toContain("missing_provenance");
  });
});
