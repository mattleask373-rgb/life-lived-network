import { describe, expect, it } from "vitest";

import { clusterMapNeeds, placeNeedsForMap, type MapNeed } from "./map-needs";
import type { MapView } from "./map-view";

const view: MapView = { lat: 0, lng: 0, spanLat: 10, spanLng: 14 };
const need = (
  id: string,
  lat: number | null,
  lng: number | null,
): MapNeed => ({
  id,
  title: `Help request ${id}`,
  placeText: "Town centre",
  lat,
  lng,
});

describe("placeNeedsForMap", () => {
  it("places valid locality coordinates in the current viewport", () => {
    const placed = placeNeedsForMap([need("one", 0, 0), need("offscreen", 40, 90)], view);
    expect(placed.map((marker) => marker.need.id)).toEqual(["one"]);
    expect(placed[0]?.left).toBeCloseTo(50);
    expect(placed[0]?.top).toBeCloseTo(50);
  });

  it("rejects missing, non-finite and out-of-range coordinates", () => {
    const placed = placeNeedsForMap(
      [
        need("no-lat", null, 0),
        need("no-lng", 0, null),
        need("nan", Number.NaN, 0),
        need("bad-lat", 91, 0),
        need("bad-lng", 0, 181),
      ],
      view,
    );
    expect(placed).toEqual([]);
  });

  it("deduplicates need IDs and enforces a finite work bound", () => {
    const placed = placeNeedsForMap([need("one", 0, 0), need("one", 0, 0)], view);
    expect(placed).toHaveLength(1);
    expect(() => placeNeedsForMap([need("one", 0, 0)], view, 0)).toThrow(RangeError);
  });
});

describe("clusterMapNeeds", () => {
  it("groups nearby need pins whose tap targets would overlap", () => {
    const placed = placeNeedsForMap(
      [need("b", 0, 0), need("a", 0.1, 0.1), need("far", 0, 5)],
      view,
    );
    const clusters = clusterMapNeeds(placed, 8, 8);
    expect(clusters.map((group) => group.needs.map((item) => item.id))).toEqual([
      ["a", "b"],
      ["far"],
    ]);
    expect(clusters[0]?.key).toBe("a|b");
  });

  it("returns stable output for the same pins and validates cluster size", () => {
    const placed = placeNeedsForMap([need("b", 0, 0), need("a", 0.1, 0.1)], view);
    expect(clusterMapNeeds(placed)).toEqual(clusterMapNeeds([...placed].reverse()));
    expect(clusterMapNeeds([])).toEqual([]);
    expect(() => clusterMapNeeds(placed, 0, 8)).toThrow(RangeError);
  });
});
