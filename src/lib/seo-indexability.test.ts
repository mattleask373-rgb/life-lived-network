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

describe("shared public SEO indexability policy", () => {
  it("keeps an unpublished page out of search", () => {
    expect(evaluateIndexability(eligible({ published: false }))).toEqual({
      status: "NOT_PUBLISHED",
      reasons: ["not_published"],
      sitemapEligible: false,
    });
  });

  it("allows complete pages only when all factual gates pass", () => {
    expect(evaluateIndexability(eligible())).toEqual({
      status: "INDEXABLE",
      reasons: [],
      sitemapEligible: true,
    });
  });

  it.each([
    ["invalid place", { placeValid: false }, "invalid_place"],
    ["policy blocked", { policyAllowed: false }, "policy_blocked"],
    ["demonstration only", { demonstrationOnly: true }, "demonstration_only"],
    ["no published records", { publishedRecordCount: 0 }, "no_published_records"],
    ["thin content", { publishedRecordCount: 2 }, "below_record_threshold"],
    ["stale records", { recordsFresh: false }, "stale_or_expired"],
    ["missing provenance", { provenancePresent: false }, "missing_provenance"],
    ["missing useful links", { internalLinksPresent: false }, "missing_internal_links"],
    ["invalid count", { publishedRecordCount: Number.NaN }, "invalid_record_count"],
  ] as const)("fails closed for %s", (_label, overrides, reason) => {
    const result = evaluateIndexability(eligible(overrides));
    expect(result.status).toBe("NOINDEX");
    expect(result.reasons).toContain(reason);
    expect(result.sitemapEligible).toBe(false);
  });

  it("requires a valid category for service pages", () => {
    const result = evaluateIndexability(eligible({ pageKind: "service", categoryValid: false }));
    expect(result.status).toBe("NOINDEX");
    expect(result.reasons).toContain("invalid_category");
  });

  it("uses an explicit route-specific threshold when supplied", () => {
    expect(
      evaluateIndexability({ publishedRecordCount: 1, minimumPublishedRecords: 1 }).status,
    ).toBe("INDEXABLE");
    expect(evaluateIndexability(eligible({ publishedRecordCount: 1 })).status).toBe("NOINDEX");
  });

  it("does not add a sitemap URL when information is incomplete", () => {
    expect(evaluateIndexability(eligible({ informationComplete: false }))).toEqual({
      status: "INDEXABLE_WITH_LIMITATIONS",
      reasons: ["incomplete_information"],
      sitemapEligible: false,
    });
  });
});
