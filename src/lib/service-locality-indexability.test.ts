import { describe, expect, it } from "vitest";

import { evaluateServiceLocalityPage } from "./service-locality-indexability";
import type { WorldEntry } from "./world-data";

const place = {
  id: "place-1",
  name: "Example Place",
  slug: "example-place",
  countrySegment: "gb",
  blurb: "A factual locality description.",
};

function service(overrides: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: "service-1",
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

describe("service locality indexability", () => {
  it("allows a valid service page with one real, current, canonical listing", () => {
    expect(
      evaluateServiceLocalityPage({
        place,
        serviceSlug: "cleaning",
        entries: [service()],
        now: Date.parse("2026-10-21T12:00:00Z"),
      }),
    ).toEqual({ status: "INDEXABLE", reasons: [], sitemapEligible: true });
  });

  it("keeps demonstration-only and empty categories out of search", () => {
    expect(
      evaluateServiceLocalityPage({
        place,
        serviceSlug: "cleaning",
        entries: [service({ demonstration: true })],
      }).sitemapEligible,
    ).toBe(false);

    expect(
      evaluateServiceLocalityPage({ place, serviceSlug: "cleaning", entries: [] }).sitemapEligible,
    ).toBe(false);
  });

  it("keeps stale and unattributed external records out of the sitemap", () => {
    expect(
      evaluateServiceLocalityPage({
        place,
        serviceSlug: "cleaning",
        entries: [service({ quality: "may have changed" })],
      }).sitemapEligible,
    ).toBe(false);

    expect(
      evaluateServiceLocalityPage({
        place,
        serviceSlug: "cleaning",
        entries: [
          service({
            origin: "source",
            sourceName: "A source",
            sourceUrl: undefined,
          }),
        ],
      }).sitemapEligible,
    ).toBe(false);
  });

  it("rejects invalid places and unknown service categories", () => {
    expect(
      evaluateServiceLocalityPage({
        place: { ...place, countrySegment: "not-a-country" },
        serviceSlug: "cleaning",
        entries: [service()],
      }).sitemapEligible,
    ).toBe(false);

    expect(
      evaluateServiceLocalityPage({ place, serviceSlug: "not-a-category", entries: [service()] })
        .sitemapEligible,
    ).toBe(false);
  });
});
