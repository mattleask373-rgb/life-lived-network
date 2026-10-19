import { describe, expect, it } from "vitest";

import { normalizeStagedPlaceBatch } from "./place-staging";

function stageRow(overrides: Record<string, unknown> = {}) {
  const sourceKey = typeof overrides.sourceKey === "string" ? overrides.sourceKey : "example:country:au";
  return {
    sourceKey,
    name: "Synthetic Test Place",
    slug: "synthetic-test-place",
    kind: "country",
    parentSourceKey: null,
    countryCode: "AU",
    currency: "AUD",
    timezone: "Australia/Brisbane",
    latitude: 1,
    longitude: 1,
    blurb: "",
    sourceDataStatus: "current",
    source: {
      sourceKey,
      sourceName: "Synthetic fixture",
      sourceUrl: "https://example.org/source",
      licenseName: "Test licence",
      licenseUrl: "https://example.org/licence",
      attribution: "Synthetic fixture only; not real locality data.",
      version: "test-v1",
      retrievedAt: "2026-10-19T00:00:00Z",
      reviewStatus: "approved_by_human",
      rightsStatus: "cleared",
    },
    ...overrides,
  };
}

describe("place staging normalizer", () => {
  it("is deterministic and never marks a normalized place published", () => {
    const first = normalizeStagedPlaceBatch([stageRow()]);
    const second = normalizeStagedPlaceBatch([stageRow()]);
    expect(first).toEqual(second);
    expect(first.eligibleForDisposablePreview).toBe(true);
    expect(first.rows[0]?.publicationStatus).toBe("not_published");
  });

  it("requires an explicit reviewed source and cleared rights before staging preview", () => {
    const report = normalizeStagedPlaceBatch([stageRow({
      source: {
        ...stageRow().source,
        reviewStatus: "pending",
        rightsStatus: "unreviewed",
      },
    })]);
    expect(report.eligibleForDisposablePreview).toBe(false);
    expect(report.rows[0]?.reasons).toContain("source_review_pending");
    expect(report.rows[0]?.reasons).toContain("rights_not_cleared");
  });

  it("blocks missing coordinates, old source status and invalid timezone", () => {
    const report = normalizeStagedPlaceBatch([
      stageRow({ sourceKey: "a", slug: "a", latitude: null, longitude: null }),
      stageRow({ sourceKey: "b", slug: "b", sourceDataStatus: "historical" }),
      stageRow({ sourceKey: "c", slug: "c", timezone: "Mars/Olympus" }),
    ]);
    expect(report.eligibleForDisposablePreview).toBe(false);
    expect(report.rows[0]?.reasons).toContain("missing_coordinates");
    expect(report.rows[1]?.reasons).toContain("source_not_current");
    expect(report.issues.some((issue) => issue.rowIndex === 2 && issue.code === "invalid_row")).toBe(true);
    expect(report.summary.blocked).toBe(3);
  });

  it("rejects duplicate source keys and globally colliding slugs", () => {
    const report = normalizeStagedPlaceBatch([
      stageRow({ sourceKey: "a", slug: "same" }),
      stageRow({ sourceKey: "a", slug: "same" }),
    ]);
    expect(report.eligibleForDisposablePreview).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toContain("duplicate_source_key");
    expect(report.issues.map((issue) => issue.code)).toContain("duplicate_slug");
  });

  it("requires the parent hierarchy or an explicit crosswalk", () => {
    const row = stageRow({ sourceKey: "child", slug: "child", kind: "town", parentSourceKey: "parent" });
    expect(normalizeStagedPlaceBatch([row]).issues.map((issue) => issue.code)).toContain("missing_parent");
    expect(normalizeStagedPlaceBatch([row], { knownParentSourceKeys: ["parent"] }).eligibleForDisposablePreview).toBe(true);
  });

  it("rejects self-parenting and parent cycles", () => {
    const self = stageRow({ sourceKey: "self", slug: "self", parentSourceKey: "self" });
    const a = stageRow({ sourceKey: "a", slug: "a", parentSourceKey: "b" });
    const b = stageRow({ sourceKey: "b", slug: "b", parentSourceKey: "a" });
    const selfReport = normalizeStagedPlaceBatch([self]);
    expect(selfReport.issues.map((issue) => issue.code)).toContain("invalid_row");
    const cycleReport = normalizeStagedPlaceBatch([a, b]);
    expect(cycleReport.issues.map((issue) => issue.code)).toContain("parent_cycle");
    expect(cycleReport.eligibleForDisposablePreview).toBe(false);
  });

  it("rejects partial coordinates and invalid field shapes", () => {
    const report = normalizeStagedPlaceBatch([
      stageRow({ sourceKey: "partial", slug: "partial", latitude: 1, longitude: null }),
      stageRow({ sourceKey: "bad", slug: "bad", currency: "AUDD" }),
    ]);
    expect(report.issues.filter((issue) => issue.code === "invalid_row")).toHaveLength(2);
    expect(report.eligibleForDisposablePreview).toBe(false);
  });

  it("rejects non-array, empty and oversized batches", () => {
    expect(normalizeStagedPlaceBatch(null).eligibleForDisposablePreview).toBe(false);
    expect(normalizeStagedPlaceBatch([]).eligibleForDisposablePreview).toBe(false);
    expect(normalizeStagedPlaceBatch(Array.from({ length: 5001 }, () => stageRow())).eligibleForDisposablePreview).toBe(false);
  });
});
