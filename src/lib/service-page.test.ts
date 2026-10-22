import { describe, expect, it } from "vitest";

import {
  servicePageCopy,
  servicePageIndexable,
  servicePageListings,
  servicePagePath,
} from "./service-page";
import type { WorldEntry } from "./world-data";
import type { WorkOpportunity } from "./work-opportunities";

function entry(overrides: Partial<WorldEntry>): WorldEntry {
  return {
    id: overrides.id ?? "e1",
    layer: "work",
    title: "Garden help",
    place: "Kings Heath",
    neighbourhood: "Kings Heath",
    x: 50,
    y: 50,
    when: "Weekdays",
    band: "today",
    minutes: 60,
    cost: 0,
    summary: "Help with gardens",
    details: [],
    host: "Someone here",
    verified: false,
    social: "friendly",
    outdoors: true,
    kind: "service",
    ...overrides,
  };
}

const gardener = entry({ id: "g1", title: "Gardener available", skills: ["gardening"] });
const demoGardener = entry({
  id: "g2",
  title: "Trial gardener",
  skills: ["gardening"],
  demonstration: true,
});

const publishedOpportunity: WorkOpportunity = {
  arrangement: "short_term",
  engagementKind: "paid_work",
  compensation: { status: "stated_paid", amountMinorUnits: 2500, currency: "AUD", basis: "hour" },
  accommodation: "not_stated",
  skillRequirements: ["Cleaning experience"],
  hostExpectations: ["Confirm the shift before travelling"],
  conditions: ["Bring closed shoes"],
  jurisdictionCountryCode: "AU",
  policyReviewStatus: "approved_by_human",
  publicationStatus: "published",
  provenance: { kind: "owner_declared", sourceName: "Test host" },
  rightsStatus: "cleared",
};

const publishedWork = entry({
  id: "w1",
  layer: "work",
  kind: "work",
  title: "Published gardening shift",
  serviceCategory: "gardening",
  workOpportunity: publishedOpportunity,
});

describe("servicePageListings", () => {
  it("returns null for an unknown service slug", () => {
    expect(servicePageListings([gardener], "not-a-service")).toBeNull();
  });

  it("separates genuine records from demonstration records", () => {
    const result = servicePageListings([gardener, demoGardener], "gardening");
    expect(result?.real.map((e) => e.id)).toEqual(["g1"]);
    expect(result?.demonstration.map((e) => e.id)).toEqual(["g2"]);
  });

  it("excludes expired and cancelled records", () => {
    const expired = entry({ id: "g3", skills: ["gardening"], quality: "expired" });
    const cancelled = entry({ id: "g4", skills: ["gardening"], cancellation: "cancelled" });
    const result = servicePageListings([expired, cancelled], "gardening");
    expect(result?.real).toEqual([]);
    expect(result?.demonstration).toEqual([]);
  });

  it("does not stretch a record into a category its words do not support", () => {
    const baker = entry({ id: "b1", title: "Sourdough mornings", summary: "Bread, weekly" });
    const result = servicePageListings([baker], "gardening");
    expect(result?.real).toEqual([]);
  });

  it("includes only published, rights-cleared work opportunities within their declared category", () => {
    expect(servicePageListings([publishedWork], "gardening")?.real.map((e) => e.id)).toEqual([
      "w1",
    ]);
    expect(servicePageListings([publishedWork], "plumbing")?.real).toEqual([]);
    const draftWork = entry({
      ...publishedWork,
      id: "w2",
      workOpportunity: { ...publishedOpportunity, publicationStatus: "review_required" },
    });
    expect(servicePageListings([draftWork], "gardening")?.real).toEqual([]);
  });
});

describe("servicePageIndexable", () => {
  it("is indexable with at least one genuine listing", () => {
    const listings = servicePageListings([gardener], "gardening")!;
    expect(servicePageIndexable(listings)).toBe(true);
  });

  it("is not indexable when only demonstration records exist", () => {
    const listings = servicePageListings([demoGardener], "gardening")!;
    expect(servicePageIndexable(listings)).toBe(false);
  });

  it("is not indexable when nothing exists", () => {
    const listings = servicePageListings([], "gardening")!;
    expect(servicePageIndexable(listings)).toBe(false);
  });
});

describe("servicePagePath", () => {
  it("builds the canonical three-segment path", () => {
    expect(
      servicePagePath({ slug: "kings-heath", countrySegment: "gb" }, { slug: "gardening" }),
    ).toBe("/gb/kings-heath/gardening");
  });

  it("falls back to gb when the country segment is empty", () => {
    expect(servicePagePath({ slug: "kings-heath", countrySegment: "" }, { slug: "yoga" })).toBe(
      "/gb/kings-heath/yoga",
    );
  });
});

describe("servicePageCopy", () => {
  it("describes genuine supply truthfully when it exists", () => {
    const listings = servicePageListings([gardener], "gardening")!;
    const copy = servicePageCopy("Kings Heath", listings);
    expect(copy.title).toBe("Gardening in Kings Heath | Real World Atlas");
    expect(copy.description).toContain("one genuine listing");
  });

  it("says a quiet page is quiet rather than implying supply", () => {
    const listings = servicePageListings([], "gardening")!;
    const copy = servicePageCopy("Kings Heath", listings);
    expect(copy.description).toContain("Nobody has offered this here yet");
    expect(copy.description).not.toContain("genuine listing");
  });
});
