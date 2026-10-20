import { describe, expect, it } from "vitest";

import {
  SERVICE_CATEGORIES,
  categoriesOf,
  categoriesPresent,
  categoryBySlug,
  categoryOf,
  inCategory,
} from "./service-taxonomy";
import type { WorldEntry } from "./world-data";
import { parseWorkOpportunity } from "./work-opportunities";

function entry(overrides: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: overrides.id ?? "e1",
    layer: "work",
    title: "Something",
    place: "Somewhere",
    neighbourhood: "Somewhere",
    x: 50,
    y: 50,
    when: "Today",
    band: "today",
    minutes: 60,
    cost: 0,
    summary: "",
    details: [],
    host: "Someone",
    verified: false,
    social: "friendly",
    outdoors: false,
    organisation: "A practice",
    ...overrides,
  };
}

/** The same record, offered by nobody — not a service at all. */
function notAService(overrides: Partial<WorldEntry> = {}): WorldEntry {
  const { organisation: _unused, ...rest } = entry(overrides);
  return rest as WorldEntry;
}

describe("service taxonomy", () => {
  it("has unique, url-safe category slugs", () => {
    const slugs = SERVICE_CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it("trusts a declared category and says so", () => {
    const match = categoryOf(entry({ serviceCategory: "sports-massage", title: "An hour" }));
    expect(match?.category.slug).toBe("sports-massage");
    expect(match?.basis).toBe("declared");
  });

  it("recognises a category from the words the record itself uses", () => {
    const match = categoryOf(entry({ title: "Sports massage appointment" }));
    expect(match?.category.slug).toBe("sports-massage");
    expect(match?.basis).toBe("matched");
    expect(match?.evidence).toContain("sports massage");
  });

  it("prefers the more specific category when both words appear", () => {
    const matches = categoriesOf(entry({ title: "Wedding photography", summary: "photographer" }));
    expect(matches[0]?.category.slug).toBe("wedding-photography");
    expect(matches.some((m) => m.category.slug === "photography")).toBe(true);
  });

  it("places nothing it cannot recognise", () => {
    expect(categoryOf(entry({ title: "A quiet afternoon" }))).toBeNull();
    expect(inCategory(entry({ title: "A quiet afternoon" }), "yoga")).toBe(false);
  });

  it("never invents a category from an unknown declared slug", () => {
    expect(categoryBySlug("brain-surgery-kings-heath")).toBeNull();
    // Falls back to the record's own words rather than to a made-up category.
    expect(
      categoryOf(entry({ serviceCategory: "nonsense", title: "Gardening" }))?.category.slug,
    ).toBe("gardening");
  });

  it("lists only categories that genuinely contain something current", () => {
    const present = categoriesPresent([
      entry({ id: "a", title: "Osteopathy appointment" }),
      entry({ id: "b", title: "Osteopathic check-up" }),
      entry({ id: "c", title: "Yoga class", quality: "expired" }),
      entry({ id: "d", title: "Plumbing callout", cancellation: "cancelled" }),
      notAService({ id: "e", title: "Gardening hour" }),
    ]);
    const slugs = present.map((p) => p.category.slug);
    expect(slugs).toContain("osteopathy");
    expect(slugs).not.toContain("yoga");
    expect(slugs).not.toContain("plumbing");
    // Not offered as a service by anybody, so not a service category.
    expect(slugs).not.toContain("gardening");
    expect(present[0]?.entries).toHaveLength(2);
  });

  it("classifies explicitly reviewed work opportunities through the shared taxonomy", () => {
    const work = notAService({
      id: "hospitality-1",
      title: "Casual hospitality shift",
      layer: "work",
      workOpportunity: parseWorkOpportunity({
        arrangement: "short_term",
        engagementKind: "paid_work",
        compensation: {
          status: "stated_paid",
          amountCents: 3200,
          currency: "AUD",
          basis: "hour",
        },
        accommodation: "not_stated",
        skillRequirements: ["As stated by the host"],
        hostExpectations: ["Confirm the shift"],
        conditions: [],
        jurisdictionCountryCode: "AU",
        policyReviewStatus: "approved_by_human",
        publicationStatus: "published",
        provenance: { kind: "owner_declared", sourceName: "Opportunity owner" },
        rightsStatus: "cleared",
      }),
    });
    expect(categoryOf(work)?.category.slug).toBe("hospitality-shifts");
    expect(categoriesPresent([work]).map((item) => item.category.slug)).toContain(
      "hospitality-shifts",
    );
  });

  it("does not classify draft, unreviewed, or demonstration work as real opportunity taxonomy", () => {
    const base = {
      arrangement: "short_term",
      engagementKind: "paid_work",
      compensation: { status: "not_stated" },
      accommodation: "not_stated",
      skillRequirements: [],
      hostExpectations: [],
      conditions: [],
      jurisdictionCountryCode: "AU",
      policyReviewStatus: "review_required",
      publicationStatus: "draft",
      provenance: { kind: "owner_declared", sourceName: "Opportunity owner" },
      rightsStatus: "unreviewed",
    };
    const draft = notAService({
      title: "Casual hospitality shift",
      layer: "work",
      workOpportunity: parseWorkOpportunity(base),
    });
    const demonstration = notAService({
      title: "Casual hospitality shift",
      layer: "work",
      demonstration: true,
      workOpportunity: parseWorkOpportunity({
        ...base,
        policyReviewStatus: "approved_by_human",
        publicationStatus: "published",
        rightsStatus: "cleared",
      }),
    });
    expect(categoryOf(draft)).toBeNull();
    expect(categoryOf(demonstration)).toBeNull();
    expect(categoriesPresent([draft, demonstration])).toEqual([]);
  });

  it("does not invent opportunity categories for a work item with no evidence", () => {
    const work = notAService({ title: "A quiet afternoon", layer: "work" });
    expect(categoryOf(work)).toBeNull();
    expect(categoriesPresent([work])).toEqual([]);
  });

  it("marks a category made only of trial records", () => {
    const present = categoriesPresent([
      entry({ id: "a", title: "Sports massage", demonstration: true }),
      entry({ id: "b", title: "Osteopathy", demonstration: false }),
    ]);
    expect(present.find((p) => p.category.slug === "sports-massage")?.demonstrationOnly).toBe(true);
    expect(present.find((p) => p.category.slug === "osteopathy")?.demonstrationOnly).toBe(false);
  });
});
