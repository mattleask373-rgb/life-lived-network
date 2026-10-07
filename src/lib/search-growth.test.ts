import { describe, expect, it } from "vitest";
import { searchOpportunity } from "./search-growth";

describe("searchOpportunity", () => {
  it("requires a real locality", () => {
    const result = searchOpportunity({
      localityId: "",
      localitySlug: "",
      intentFamily: "whats_on",
      normalizedQuery: "what's on tonight",
      evidence: [{ source: "trend", observedAt: "2026-10-06", confidence: 0.8 }],
      realWorldEvidenceCount: 5,
      actionability: "high",
    });

    expect(result.indexability).toBe("noindex_candidate");
  });

  it("does not turn demand into a fabricated page", () => {
    const result = searchOpportunity({
      localityId: "byron-bay",
      localitySlug: "byron-bay",
      intentFamily: "whats_on",
      normalizedQuery: "what's on in byron bay",
      evidence: [{ source: "trend", observedAt: "2026-10-06", confidence: 0.8 }],
      realWorldEvidenceCount: 0,
      actionability: "high",
    });

    expect(result.indexability).toBe("needs_evidence");
  });

  it("requires actionability before an indexable candidate", () => {
    const result = searchOpportunity({
      localityId: "glasgow",
      localitySlug: "glasgow",
      intentFamily: "local_service",
      normalizedQuery: "sports massage glasgow",
      evidence: [{ source: "first_party", observedAt: "2026-10-06", confidence: 0.9 }],
      realWorldEvidenceCount: 3,
      actionability: "unknown",
    });

    expect(result.indexability).toBe("needs_evidence");
  });

  it("allows evidence-backed actionable opportunities to reach the existing quality gate", () => {
    const result = searchOpportunity({
      localityId: "glasgow",
      localitySlug: "glasgow",
      intentFamily: "local_service",
      normalizedQuery: "sports massage glasgow",
      evidence: [{ source: "first_party", observedAt: "2026-10-06", confidence: 0.9 }],
      realWorldEvidenceCount: 3,
      actionability: "high",
    });

    expect(result.indexability).toBe("indexable_candidate");
  });
});
