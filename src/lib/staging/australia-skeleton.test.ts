import { describe, expect, it } from "vitest";

import { normalizeStagedPlaceBatch } from "../place-staging";
import { AUSTRALIA_STAGING_SKELETON } from "./australia-skeleton";

describe("Australia pilot staging skeleton", () => {
  it("has a connected proposed hierarchy and keeps every candidate unpublished", () => {
    const keys = new Set(AUSTRALIA_STAGING_SKELETON.map((row) => row.sourceKey));

    expect(AUSTRALIA_STAGING_SKELETON).toHaveLength(6);
    for (const row of AUSTRALIA_STAGING_SKELETON) {
      expect(row.countryCode).toBe("AU");
      expect(row.currency).toBe("AUD");
      expect(row.publicationStatus).toBe("not_published");
      expect(row.hierarchyDecision).toBe("proposed_not_approved");
      if (row.slug === "agnes-water") {
        expect(row.latitude).toBe(-24.2125857);
        expect(row.longitude).toBe(151.90327882);
      } else if (row.slug === "port-douglas") {
        expect(row.latitude).toBe(-16.49944);
        expect(row.longitude).toBe(145.46083);
      } else {
        expect(row.latitude).toBeNull();
        expect(row.longitude).toBeNull();
      }
      expect(row.source.reviewStatus).toBe("pending");
      expect(row.source.rightsStatus).toBe("unreviewed");
      if (row.slug === "agnes-water" || row.slug === "port-douglas") {
        expect(row.source.licenseName).toBe("Creative Commons Attribution 4.0 International");
        expect(row.source.licenseUrlCandidate).toBe("https://creativecommons.org/licenses/by/4.0/");
        expect(row.source.attribution).toBe("© State of Queensland (Department of Resources) 2024");
      } else {
        expect(row.source.licenseName).toBeNull();
        expect(row.source.licenseUrlCandidate).toBeNull();
      }
      expect(row.source.version).toBeNull();
      expect(row.source.retrievedAt).toBeNull();
      if (row.parentSourceKey) expect(keys.has(row.parentSourceKey)).toBe(true);
    }
  });

  it("uses official Queensland gazetteer points as unapproved candidates only", () => {
    const agnes = AUSTRALIA_STAGING_SKELETON.find((row) => row.slug === "agnes-water");
    const portDouglas = AUSTRALIA_STAGING_SKELETON.find((row) => row.slug === "port-douglas");
    for (const row of [agnes, portDouglas]) {
      expect(row?.source.sourceName).toBe("Queensland Government Department of Resources");
      expect(row?.source.reviewStatus).toBe("pending");
      expect(row?.source.rightsStatus).toBe("unreviewed");
      expect(row?.source.retrievedAt).toBeNull();
      expect(row?.publicationStatus).toBe("not_published");
    }
  });

  it("keeps local timezone values as review candidates and country semantics unresolved", () => {
    const australia = AUSTRALIA_STAGING_SKELETON.find((row) => row.kind === "country");
    const byron = AUSTRALIA_STAGING_SKELETON.find((row) => row.slug === "byron-bay");
    const agnes = AUSTRALIA_STAGING_SKELETON.find((row) => row.slug === "agnes-water");
    const portDouglas = AUSTRALIA_STAGING_SKELETON.find((row) => row.slug === "port-douglas");

    expect(australia?.timezoneCandidate).toBeNull();
    expect(australia?.timezoneDecisionRequired).toBe("country_semantics_unresolved");
    expect(byron?.timezoneCandidate).toBe("Australia/Sydney");
    expect(agnes?.timezoneCandidate).toBe("Australia/Brisbane");
    expect(portDouglas?.timezoneCandidate).toBe("Australia/Brisbane");
    for (const row of [byron, agnes, portDouglas]) {
      expect(row?.timezoneDecisionRequired).toBe("candidate_pending_review");
      expect(row?.publicationStatus).toBe("not_published");
    }
  });

  it("fails the production staging validator until provenance and retrieval evidence exist", () => {
    const payload = AUSTRALIA_STAGING_SKELETON.map((row) => ({
      sourceKey: row.sourceKey,
      name: row.name,
      slug: row.slug,
      kind: row.kind,
      parentSourceKey: row.parentSourceKey,
      countryCode: row.countryCode,
      currency: row.currency,
      timezone: row.timezoneCandidate ?? "",
      latitude: row.latitude,
      longitude: row.longitude,
      blurb: row.blurb,
      sourceDataStatus: row.sourceDataStatus,
      source: {
        sourceKey: row.source.sourceKey,
        sourceName: row.source.sourceName,
        sourceUrl: row.source.sourceUrlCandidate,
        licenseName: row.source.licenseName ?? "",
        licenseUrl: row.source.licenseUrlCandidate ?? "",
        attribution: row.source.attribution ?? "",
        version: row.source.version ?? "",
        retrievedAt: row.source.retrievedAt ?? "",
        reviewStatus: row.source.reviewStatus,
        rightsStatus: row.source.rightsStatus,
      },
    }));
    const report = normalizeStagedPlaceBatch(payload);

    expect(report.eligibleForDisposablePreview).toBe(false);
    expect(report.rows).toEqual([]);
    expect(report.issues).toHaveLength(AUSTRALIA_STAGING_SKELETON.length);
    expect(report.issues.every((issue) => issue.code === "invalid_row")).toBe(true);
  });
});
