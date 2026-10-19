import { describe, expect, it } from "vitest";

import { evaluateIndexability, type IndexabilityInput } from "./seo-indexability";

function eligible(overrides: Partial<IndexabilityInput> = {}): IndexabilityInput {
  return {
    pageKind: "locality",
    published: true,
    placeValid: true,
    publishedRecordCount: 3,
    demonstrationOnly: false,
    informationComplete: true,
    recordsFresh: true,
    provenancePresent: true,
    internalLinksPresent: true,
    policyAllowed: true,
    ...overrides,
  };
}

describe("public SEO indexability gate", () => {
  it("distinguishes unpublished pages from published pages held out of search", () => {
    expect(evaluateIndexability(eligible({ published: false }))).toEqual({
      status: "NOT_PUBLISHED",
      reasons: ["not_published"],
      sitemapEligible: false,
    });
  });

  it("allows a complete page only when its real evidence clears every hard gate", () => {
    expect(evaluateIndexability(eligible())).toEqual({
      status: "INDEXABLE",
      reasons: [],
      sitemapEligible: true,
    });
  });

  it("does not require a service category for a locality page", () => {
    expect(evaluateIndexability(eligible({ pageKind: "locality" })).status).toBe("INDEXABLE");
  });

  it("requires a valid category for service pages", () => {
    const result = evaluateIndexability(eligible({ pageKind: "service", categoryValid: false }));
    expect(result.status).toBe("NOINDEX");
    expect(result.reasons).toContain("invalid_category");
    expect(result.sitemapEligible).toBe(false);
  });

  it.each([
    ["invalid locality", { placeValid: false }, "invalid_place"],
    ["policy-blocked content", { policyAllowed: false }, "policy_blocked"],
    ["demonstration-only content", { demonstrationOnly: true }, "demonstration_only"],
    ["no real records", { publishedRecordCount: 0 }, "no_published_records"],
    ["thin content", { publishedRecordCount: 2 }, "below_record_threshold"],
    ["stale records", { recordsFresh: false }, "stale_or_expired"],
    ["missing provenance", { provenancePresent: false }, "missing_provenance"],
    ["missing internal links", { internalLinksPresent: false }, "missing_internal_links"],
    ["invalid count", { publishedRecordCount: Number.NaN }, "invalid_record_count"],
  ] as const)("fails closed for %s", (_label, overrides, reason) => {
    const result = evaluateIndexability(eligible(overrides));
    expect(result.status).toBe("NOINDEX");
    expect(result.reasons).toContain(reason);
    expect(result.sitemapEligible).toBe(false);
  });

  it("supports an explicit record threshold without changing the default", () => {
    const input = eligible({ publishedRecordCount: 2, minimumPublishedRecords: 2 });
    expect(evaluateIndexability(input).status).toBe("INDEXABLE");
    expect(evaluateIndexability(eligible({ publishedRecordCount: 2 })).status).toBe("NOINDEX");
  });

  it("labels incomplete pages but still excludes them from sitemaps", () => {
    expect(evaluateIndexability(eligible({ informationComplete: false }))).toEqual({
      status: "INDEXABLE_WITH_LIMITATIONS",
      reasons: ["incomplete_information"],
      sitemapEligible: false,
    });
  });
});
