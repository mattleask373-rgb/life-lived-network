import { describe, expect, it } from "vitest";
import { buildPlaceIndex, Place } from "./places";
import { normalizeQuery, parseSearchIntent } from "./search-intent";

const testPlaces: Place[] = [
  {
    id: "place-bham",
    parent_id: "place-wm",
    kind: "city",
    name: "Birmingham",
    slug: "birmingham",
    country_code: "GB",
    timezone: "Europe/London",
    currency: "GBP",
    lat: 52.48,
    lng: -1.89,
    blurb: "",
  },
  {
    id: "place-kh",
    parent_id: "place-bham",
    kind: "neighbourhood",
    name: "Kings Heath",
    slug: "kings-heath",
    country_code: "GB",
    timezone: "Europe/London",
    currency: "GBP",
    lat: 52.43,
    lng: -1.89,
    blurb: "",
  },
  {
    id: "place-brixton",
    parent_id: "place-london",
    kind: "neighbourhood",
    name: "Brixton",
    slug: "brixton",
    country_code: "GB",
    timezone: "Europe/London",
    currency: "GBP",
    lat: 51.46,
    lng: -0.11,
    blurb: "",
  },
  {
    id: "place-manchester",
    parent_id: "place-nw",
    kind: "city",
    name: "Manchester",
    slug: "manchester",
    country_code: "GB",
    timezone: "Europe/London",
    currency: "GBP",
    lat: 53.48,
    lng: -2.24,
    blurb: "",
  },
];

const placeIndex = buildPlaceIndex(testPlaces);

describe("Search Intent & Locality Resolution", () => {
  it("normalizes queries safely", () => {
    expect(normalizeQuery("  Drake,  Birmingham!  ")).toBe("drake birmingham");
  });

  it("extracts artist query with canonical locality: 'Drake Birmingham'", () => {
    const res = parseSearchIntent("Drake Birmingham", placeIndex);
    expect(res.locality?.place.name).toBe("Birmingham");
    expect(res.intentFamily).toBe("whats_on");
    expect(res.subject).toBe("drake");
    expect(res.suggestedPath).toBe("/gb/birmingham?intent=whats_on&subject=drake");
  });

  it("extracts service query with canonical locality: 'gardener Brixton'", () => {
    const res = parseSearchIntent("gardener Brixton", placeIndex);
    expect(res.locality?.place.name).toBe("Brixton");
    expect(res.intentFamily).toBe("local_service");
    expect(res.subject).toBe("gardener");
    expect(res.suggestedPath).toBe("/gb/brixton?intent=local_service&subject=gardener");
  });

  it("extracts time-specific event query: 'things to do Birmingham tonight'", () => {
    const res = parseSearchIntent("things to do Birmingham tonight", placeIndex);
    expect(res.locality?.place.name).toBe("Birmingham");
    expect(res.intentFamily).toBe("whats_on");
    expect(res.timeframe).toBe("tonight");
    expect(res.suggestedPath).toBe("/gb/birmingham?intent=whats_on&subject=things%20to%20do&timeframe=tonight");
  });

  it("extracts multi-token neighbourhood query: 'live music Kings Heath'", () => {
    const res = parseSearchIntent("live music Kings Heath", placeIndex);
    expect(res.locality?.place.name).toBe("Kings Heath");
    expect(res.intentFamily).toBe("whats_on");
  });

  it("handles unknown locality transparently without guessing", () => {
    const res = parseSearchIntent("gardener Atlantis", placeIndex);
    expect(res.locality).toBeNull();
    expect(res.intentFamily).toBe("local_service");
    expect(res.subject).toBe("gardener");
  });
});
