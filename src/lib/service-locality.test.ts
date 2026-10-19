import { describe, expect, it } from "vitest";

import {
  categoryServiceEntries,
  evaluateServiceLocalityPage,
  publicServiceEntries,
  serviceLocalityPath,
} from "./service-locality";
import type { WorldEntry } from "./world-data";

const place = {
  id: "place-example",
  name: "Example Place",
  slug: "example-place",
  countrySegment: "au",
  blurb: "A recorded locality for contract tests.",
};

function service(overrides: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: "service-1",
    layer: "work",
    kind: "service",
    serviceCategory: "cleaning",
    title: "Cleaning service",
    place: "Example Place",
    neighbourhood: "Example Place",
    x: 1,
    y: 1,
    when: "Times not stated",
    band: "today",
    minutes: 60,
    cost: 0,
    currency: "AUD",
    summary: "A service record supplied for tests.",
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

describe("service + locality route evidence", () => {
  it("builds one canonical country/place/service path", () => {
    expect(serviceLocalityPath(place, "cleaning")).toBe("/au/example-place/cleaning");
  });

  it("uses the shared service taxonomy and never treats ordinary entries as services", () => {
    const matching = service();
    const unrelated = service({
      id: "ordinary",
      kind: "community",
      serviceCategory: undefined,
      title: "A community gathering",
      organisation: undefined,
    });
    expect(categoryServiceEntries([unrelated, matching], "cleaning").map((row) => row.id)).toEqual([
      "service-1",
    ]);
    expect(categoryServiceEntries([matching], "not-a-category")).toEqual([]);
  });

  it("excludes demonstration records from public cards and the genuine count", () => {
    const trial = service({ id: "demo", demonstration: true });
    expect(publicServiceEntries([trial], "cleaning")).toEqual([]);
    const result = evaluateServiceLocalityPage({
      place,
      serviceSlug: "cleaning",
      entries: [trial],
      now: Date.parse("2026-10-19T12:00:00Z"),
    });
    expect(result.status).toBe("NOINDEX");
    expect(result.sitemapEligible).toBe(false);
    expect(result.reasons).toContain("no_published_records");
  });

  it("keeps thin pages out of metadata and sitemaps", () => {
    const result = evaluateServiceLocalityPage({
      place,
      serviceSlug: "cleaning",
      entries: [service(), service({ id: "service-2" })],
      now: Date.parse("2026-10-19T12:00:00Z"),
    });
    expect(result.status).toBe("NOINDEX");
    expect(result.reasons).toContain("below_record_threshold");
    expect(result.sitemapEligible).toBe(false);
  });

  it("allows only sufficiently evidenced, current service records to pass", () => {
    const entries = [service({ id: "one" }), service({ id: "two" }), service({ id: "three" })];
    const result = evaluateServiceLocalityPage({
      place,
      serviceSlug: "cleaning",
      entries,
      now: Date.parse("2026-10-19T12:00:00Z"),
    });
    expect(result).toEqual({ status: "INDEXABLE", reasons: [], sitemapEligible: true });
  });

  it("fails closed when provenance or freshness is not established", () => {
    const missingSource = service({
      origin: "source",
      sourceName: undefined,
      sourceUrl: undefined,
    });
    const stale = service({ id: "stale", quality: "may have changed" });
    const result = evaluateServiceLocalityPage({
      place,
      serviceSlug: "cleaning",
      entries: [service(), missingSource, stale],
      now: Date.parse("2026-10-19T12:00:00Z"),
    });
    expect(result.status).toBe("NOINDEX");
    expect(result.reasons).toContain("missing_provenance");
    expect(result.reasons).toContain("stale_or_expired");
    expect(result.sitemapEligible).toBe(false);
  });

  it("does not use an invalid category as an indexable landing page", () => {
    const result = evaluateServiceLocalityPage({
      place,
      serviceSlug: "unknown",
      entries: [service(), service({ id: "two" }), service({ id: "three" })],
    });
    expect(result.status).toBe("NOINDEX");
    expect(result.reasons).toContain("invalid_category");
  });
});
