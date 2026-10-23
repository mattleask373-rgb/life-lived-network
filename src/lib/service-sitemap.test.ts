import { describe, expect, it } from "vitest";

import { buildPlaceIndex, type Place } from "./places";
import { indexableServicePaths } from "./service-sitemap";
import type { PublicListingSitemapRow } from "./locality-sitemap";
import type { WorldEntry } from "./world-data";
import type { WorkOpportunity } from "./work-opportunities";

function place(overrides: Partial<Place> & Pick<Place, "id" | "name" | "slug" | "kind">): Place {
  return {
    parent_id: null,
    country_code: "GB",
    timezone: "Europe/London",
    currency: "GBP",
    lat: null,
    lng: null,
    blurb: "",
    ...overrides,
  };
}

const index = buildPlaceIndex([
  place({ id: "region", name: "West Midlands", slug: "west-midlands", kind: "region" }),
  place({ id: "city", name: "Birmingham", slug: "birmingham", kind: "city", parent_id: "region" }),
]);

function entry(overrides: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id: "cleaner-1",
    placeId: "city",
    layer: "experience",
    title: "Holiday rental cleaner",
    place: "Birmingham",
    neighbourhood: "Birmingham",
    x: 50,
    y: 50,
    when: "As agreed",
    band: "today",
    minutes: 60,
    cost: 0,
    summary: "Cleaning between guest stays",
    details: [],
    host: "Posted by someone here",
    verified: false,
    social: "friendly",
    outdoors: false,
    kind: "service",
    skills: ["cleaning", "holiday rental"],
    quality: "unverified",
    ...overrides,
  };
}

const reviewedWorkOpportunity: WorkOpportunity = {
  arrangement: "seasonal",
  engagementKind: "paid_work",
  compensation: {
    status: "stated_paid",
    amountMinorUnits: 1200,
    currency: "GBP",
    basis: "hour",
  },
  accommodation: "not_stated",
  skillRequirements: ["hospitality"],
  hostExpectations: ["Reliability"],
  conditions: ["Legal right to work required"],
  jurisdictionCountryCode: "GB",
  policyReviewStatus: "approved_by_human",
  publicationStatus: "published",
  provenance: {
    kind: "owner_declared",
    sourceName: "Test employer",
  },
  rightsStatus: "cleared",
};

function rowsFor(entries: WorldEntry[]): PublicListingSitemapRow[] {
  return entries.map((value) => ({
    id: value.id,
    place_id: "city",
    demonstration: value.demonstration ?? false,
  }));
}

describe("service sitemap indexability", () => {
  it("includes canonical service-in-place paths when a genuine service exists", () => {
    const cleaner = entry();
    const paths = indexableServicePaths(
      index,
      rowsFor([cleaner]),
      new Map([[cleaner.id, cleaner]]),
    );
    expect(paths).toContain("/gb/birmingham/cleaning");
    expect(paths).toContain("/gb/west-midlands/cleaning");
  });

  it("includes reviewed, rights-cleared work opportunities using the same page taxonomy", () => {
    const job = entry({
      id: "seasonal-hospitality",
      layer: "work",
      kind: "opportunity",
      title: "Seasonal hospitality work",
      summary: "Paid seasonal work in a local hotel",
      skills: ["hospitality shifts"],
      workOpportunity: reviewedWorkOpportunity,
    });
    const paths = indexableServicePaths(index, rowsFor([job]), new Map([[job.id, job]]));
    expect(paths).toContain("/gb/birmingham/hospitality-shifts");
    expect(paths).toContain("/gb/west-midlands/hospitality-shifts");
  });

  it("excludes demonstration-only services", () => {
    const demo = entry({ id: "demo-cleaner", demonstration: true });
    expect(indexableServicePaths(index, rowsFor([demo]), new Map([[demo.id, demo]]))).toEqual([]);
  });

  it("does not infer a service category from an unrelated record", () => {
    const unrelated = entry({
      id: "x",
      kind: "event",
      title: "An evening together",
      summary: "Music and chat",
      skills: [],
    });
    expect(
      indexableServicePaths(index, rowsFor([unrelated]), new Map([[unrelated.id, unrelated]])),
    ).toEqual([]);
  });

  it("uses only the first 60 records the service page renders", () => {
    const demos = Array.from({ length: 60 }, (_, i) =>
      entry({ id: `demo-${i}`, demonstration: true }),
    );
    const cleaner = entry({ id: "after-first-page" });
    const rows = [...rowsFor(demos), ...rowsFor([cleaner])];
    const entries = new Map([...demos, cleaner].map((value) => [value.id, value]));
    expect(indexableServicePaths(index, rows, entries)).not.toContain("/gb/birmingham/cleaning");
  });

  it("fails closed when the bounded source scan is incomplete", () => {
    const cleaner = entry();
    expect(
      indexableServicePaths(index, rowsFor([cleaner]), new Map([[cleaner.id, cleaner]]), {
        complete: false,
      }),
    ).toEqual([]);
  });
});
