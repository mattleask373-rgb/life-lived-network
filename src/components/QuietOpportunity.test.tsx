import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QuietOpportunity } from "./QuietOpportunity";
import type { AcquisitionOpportunity } from "@/lib/acquisition-opportunity";

const baseOpportunity: AcquisitionOpportunity = {
  id: "acq:brixton:gardener",
  localityId: "brixton",
  localityName: "Brixton",
  category: "gardener",
  subject: "gardener",
  gapStatus: "ZERO_SUPPLY",
  reason:
    "Canonical discovery returned zero trustworthy results. This does not prove that no real-world provider exists; it only means Living World currently has no evidence-backed possibility to show.",
  priority: "high",
  actionable: true,
  requiredEvidence: [
    "capability statement (what the person can do)",
    "willingness to be found for this kind of work",
    "service area (distinct from residence)",
    "availability windows or explicit 'availability unknown'",
  ],
  measurement: {
    type: "acquisition_opportunity_surfaced",
    localityId: "brixton",
    category: "gardener",
    gapStatus: "ZERO_SUPPLY",
    timestamp: "2026-10-06T18:00:00Z",
  },
};

describe("QuietOpportunity", () => {
  it("renders honest zero-supply language", () => {
    const html = renderToStaticMarkup(<QuietOpportunity opportunity={baseOpportunity} />);
    expect(html).toContain("It's quiet here for this");
    expect(html).toContain("No known gardener yet in Brixton");
    expect(html).toContain("does not prove that no real-world provider exists");
    expect(html).toContain("service area (distinct from residence)");
  });

  it("renders sparse language for WEAK_SUPPLY", () => {
    const weak: AcquisitionOpportunity = {
      ...baseOpportunity,
      gapStatus: "WEAK_SUPPLY",
      priority: "medium",
      reason: "Canonical discovery returned only weak or related results.",
    };
    const html = renderToStaticMarkup(<QuietOpportunity opportunity={weak} />);
    expect(html).toContain("Sparse supply recorded");
    expect(html).toContain("Only weak or related gardener results");
  });

  it("returns null markup when not actionable", () => {
    const none: AcquisitionOpportunity = {
      ...baseOpportunity,
      actionable: false,
      priority: "none",
      gapStatus: "SATISFIED",
    };
    const html = renderToStaticMarkup(<QuietOpportunity opportunity={none} />);
    expect(html).toBe("");
  });

  it("never claims fabricated providers or demand", () => {
    const html = renderToStaticMarkup(<QuietOpportunity opportunity={baseOpportunity} />);
    expect(html).not.toMatch(/we found|available now|popular|reviews|book now/i);
  });
});
