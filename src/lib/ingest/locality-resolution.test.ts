import { describe, expect, it } from "vitest";

import {
  isPlaceWithinSourceCoverage,
  resolveSourceLocality,
  type CanonicalLocality,
} from "./locality-resolution";

const places: CanonicalLocality[] = [
  { id: "gb", parent_id: null, name: "United Kingdom", slug: "united-kingdom", country_code: "GB" },
  { id: "wm", parent_id: "gb", name: "West Midlands", slug: "west-midlands", country_code: "GB" },
  { id: "bham", parent_id: "wm", name: "Birmingham", slug: "birmingham", country_code: "GB" },
  { id: "digbeth", parent_id: "bham", name: "Digbeth", slug: "digbeth", country_code: "GB" },
  { id: "brum-ne", parent_id: "bham", name: "Northfield", slug: "northfield", country_code: "GB" },
  {
    id: "another-northfield",
    parent_id: "wm",
    name: "Northfield",
    slug: "northfield-west-midlands",
    country_code: "GB",
  },
  { id: "pt", parent_id: null, name: "Portugal", slug: "portugal", country_code: "PT" },
  { id: "lis", parent_id: "pt", name: "Lisbon", slug: "lisbon", country_code: "PT" },
  { id: "lis-old", parent_id: "pt", name: "São João", slug: "sao-joao", country_code: "PT" },
  { id: "es", parent_id: null, name: "Spain", slug: "spain", country_code: "ES" },
  { id: "es-sao", parent_id: "es", name: "Sao Joao", slug: "sao-joao-es", country_code: "ES" },
];

describe("source event canonical locality resolution", () => {
  it("maps a unique source-declared city to its canonical place, not the query centre", () => {
    expect(
      resolveSourceLocality({
        evidence: { neighbourhood: "Digbeth" },
        queryCountryCode: "GB",
        places,
      }),
    ).toMatchObject({
      status: "resolved",
      placeId: "digbeth",
      placeSlug: "digbeth",
      matchedBy: "exact_name_country",
    });
  });

  it("prefers a canonical locality slug when the source supplies one", () => {
    expect(
      resolveSourceLocality({
        evidence: { localitySlug: "BIRMINGHAM", neighbourhood: "Digbeth" },
        queryCountryCode: "GB",
        places,
      }),
    ).toMatchObject({ status: "resolved", placeId: "bham", matchedBy: "canonical_slug" });
  });

  it("does not use the venue name, artist, or query centre as locality evidence", () => {
    expect(
      resolveSourceLocality({
        evidence: {},
        queryCountryCode: "GB",
        places,
      }),
    ).toEqual({ status: "unresolved", reason: "MISSING_LOCALITY" });
  });

  it("refuses repeated place names when the source does not provide enough evidence", () => {
    expect(
      resolveSourceLocality({
        evidence: { neighbourhood: "Northfield" },
        queryCountryCode: "GB",
        places,
      }),
    ).toEqual({ status: "unresolved", reason: "AMBIGUOUS_CANONICAL_NAME" });
  });

  it("does not use source scope alone to disambiguate repeated locality names", () => {
    expect(
      resolveSourceLocality({
        evidence: { neighbourhood: "Northfield" },
        queryCountryCode: "GB",
        sourcePlaceIds: ["bham"],
        places,
      }),
    ).toEqual({ status: "unresolved", reason: "AMBIGUOUS_CANONICAL_NAME" });
  });

  it("refuses a source result outside its configured locality scope", () => {
    expect(
      resolveSourceLocality({
        evidence: { neighbourhood: "Lisbon" },
        queryCountryCode: "PT",
        sourcePlaceIds: ["bham"],
        places,
      }),
    ).toEqual({ status: "unresolved", reason: "OUTSIDE_SOURCE_SCOPE" });
  });

  it("refuses a provider country that conflicts with the country-scoped source query", () => {
    expect(
      resolveSourceLocality({
        evidence: { neighbourhood: "Lisbon", countryCode: "PT" },
        queryCountryCode: "GB",
        places,
      }),
    ).toEqual({ status: "unresolved", reason: "COUNTRY_MISMATCH" });
  });

  it("validates the selected refresh place against an explicit source coverage scope", () => {
    expect(isPlaceWithinSourceCoverage("digbeth", ["bham"], places)).toBe(true);
    expect(isPlaceWithinSourceCoverage("lis", ["bham"], places)).toBe(false);
    expect(isPlaceWithinSourceCoverage("lis", ["missing-place"], places)).toBe(false);
    expect(isPlaceWithinSourceCoverage("lis", [], places)).toBe(true);
    expect(isPlaceWithinSourceCoverage("missing-place", [], places)).toBe(false);
  });

  it("uses the country boundary to resolve identical labels across countries", () => {
    expect(
      resolveSourceLocality({
        evidence: { neighbourhood: "Sao Joao", countryCode: "PT" },
        queryCountryCode: "PT",
        places,
      }),
    ).toMatchObject({ status: "resolved", placeId: "lis-old" });
  });

  it("will not choose a nearest canonical place based on approximate coordinates alone", () => {
    expect(
      resolveSourceLocality({
        evidence: { neighbourhood: "Unmapped neighbourhood" },
        queryCountryCode: "GB",
        places,
      }),
    ).toEqual({ status: "unresolved", reason: "NO_CANONICAL_MATCH" });
  });

  it("fails closed for invalid or missing country scope and broken source configuration", () => {
    expect(
      resolveSourceLocality({
        evidence: { neighbourhood: "Birmingham" },
        queryCountryCode: "",
        places,
      }),
    ).toEqual({ status: "unresolved", reason: "INVALID_QUERY_COUNTRY" });
    expect(
      resolveSourceLocality({
        evidence: { neighbourhood: "Birmingham", countryCode: "United Kingdom" },
        queryCountryCode: "GB",
        places,
      }),
    ).toEqual({ status: "unresolved", reason: "INVALID_SOURCE_COUNTRY" });
    expect(
      resolveSourceLocality({
        evidence: { neighbourhood: "Birmingham" },
        queryCountryCode: "GB",
        sourcePlaceIds: ["missing-place-id"],
        places,
      }),
    ).toEqual({ status: "unresolved", reason: "INVALID_SOURCE_SCOPE" });
  });
});
