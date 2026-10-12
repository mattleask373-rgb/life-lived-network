import { describe, expect, it } from "vitest";
import { buildPlaceIndex, type Place } from "./places";
import { entryInScope, exactGeography, geographicReach, needGeography } from "./geo-scope";

function place(id: string, kind: Place["kind"], parentId: string | null): Place {
  return {
    id,
    parent_id: parentId,
    kind,
    name: id,
    slug: id,
    country_code: "GB",
    timezone: "Europe/London",
    currency: "GBP",
    lat: null,
    lng: null,
    blurb: "",
  };
}

const INDEX = buildPlaceIndex([
  place("uk", "country", null),
  place("west-midlands", "region", "uk"),
  place("birmingham", "city", "west-midlands"),
  place("kings-heath", "neighbourhood", "birmingham"),
  place("herefordshire", "area", "uk"),
]);

describe("how far a need reaches", () => {
  it("counts the place itself and everywhere inside it as local", () => {
    const geo = needGeography(INDEX, "birmingham");
    expect(geo.localPlaceIds).toContain("birmingham");
    expect(geo.localPlaceIds).toContain("kings-heath");
    expect(geo.localPlaceIds).not.toContain("west-midlands");
  });

  it("requires a stated service area and never infers reach from residence", () => {
    const geo = needGeography(INDEX, "kings-heath");
    expect(geographicReach({ serviceAreaPlaceIds: [] }, geo)).toBeNull();
    expect(geographicReach({ serviceAreaPlaceIds: ["birmingham"] }, geo)?.kind).toBe(
      "stated_service_area",
    );
  });

  it("keeps separate places separate, however big they are", () => {
    const geo = needGeography(INDEX, "birmingham");
    expect(
      geographicReach({ placeId: "herefordshire", serviceAreaPlaceIds: ["herefordshire"] }, geo),
    ).toBeNull();
  });

  it("falls back to exactly one place when there is no hierarchy to hand", () => {
    const geo = exactGeography("birmingham");
    expect(geo.localPlaceIds).toEqual(["birmingham"]);
    expect(geographicReach({ serviceAreaPlaceIds: [] }, geo)).toBeNull();
  });

  it("keeps things happening inside the area, and drops things outside it", () => {
    const geo = needGeography(INDEX, "birmingham");
    expect(entryInScope("kings-heath", geo)).toBe(true);
    expect(entryInScope("herefordshire", geo)).toBe(false);
  });
});
