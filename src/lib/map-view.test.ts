import { describe, expect, it } from "vitest";

import {
  MAX_SPAN,
  MIN_SPAN,
  boundsOf,
  clusterPlaced,
  fitView,
  panView,
  placeEntries,
  scaleOf,
  toScreen,
  zoomView,
  type MapView,
} from "./map-view";
import type { WorldEntry } from "./world-data";

function entry(id: string, lat: number | null, lng: number | null): WorldEntry {
  return {
    id,
    layer: "work",
    title: id,
    place: "Somewhere",
    neighbourhood: "",
    x: 50,
    y: 50,
    lat,
    lng,
    when: "today",
    band: "today",
    minutes: 60,
    cost: 0,
    summary: "",
    details: [],
    host: "someone",
    verified: false,
    social: "quiet",
    outdoors: false,
  } as WorldEntry;
}

const view: MapView = { lat: 52.43, lng: -1.89, spanLat: 0.1, spanLng: 0.14 };

describe("map viewport", () => {
  it("puts the centre of the view in the centre of the frame", () => {
    const point = toScreen({ lat: view.lat, lng: view.lng }, view);
    expect(point.left).toBeCloseTo(50);
    expect(point.top).toBeCloseTo(50);
  });

  it("puts north at the top", () => {
    const north = toScreen({ lat: view.lat + 0.04, lng: view.lng }, view);
    const south = toScreen({ lat: view.lat - 0.04, lng: view.lng }, view);
    expect(north.top).toBeLessThan(south.top);
  });

  it("zooms within honest limits", () => {
    let zoomed = view;
    for (let i = 0; i < 30; i += 1) zoomed = zoomView(zoomed, 0.5);
    expect(zoomed.spanLat).toBe(MIN_SPAN);
    for (let i = 0; i < 60; i += 1) zoomed = zoomView(zoomed, 2);
    expect(zoomed.spanLat).toBe(MAX_SPAN);
  });

  it("pans without changing how much is visible", () => {
    const moved = panView(view, 0.5, 0.25);
    expect(moved.spanLat).toBe(view.spanLat);
    expect(moved.spanLng).toBe(view.spanLng);
    expect(moved.lng).toBeGreaterThan(view.lng);
    expect(moved.lat).toBeGreaterThan(view.lat);
  });

  it("keeps longitude on the map when panning round the world", () => {
    const moved = panView({ lat: 0, lng: 170, spanLat: 40, spanLng: 60 }, 1, 0);
    expect(moved.lng).toBeLessThanOrEqual(180);
    expect(moved.lng).toBeGreaterThanOrEqual(-180);
  });

  it("only shows what the viewport can actually show", () => {
    const placed = placeEntries(
      [entry("in", 52.43, -1.89), entry("far", 40, 10), entry("nowhere", null, null)],
      view,
    );
    expect(placed.map((p) => p.entry.id)).toEqual(["in"]);
  });

  it("projects both sides of the date line correctly around +180 and -180", () => {
    const entries = [entry("east", 0, 175), entry("west", 0, -175)];
    const eastCentred = placeEntries(entries, { lat: 0, lng: 179, spanLat: 20, spanLng: 20 });
    expect(eastCentred.map((item) => item.entry.id)).toEqual(["east", "west"]);
    expect(eastCentred[0]?.left).toBeCloseTo(30);
    expect(eastCentred[1]?.left).toBeCloseTo(80);

    const westCentred = placeEntries(entries, { lat: 0, lng: -179, spanLat: 20, spanLng: 20 });
    expect(westCentred.map((item) => item.entry.id)).toEqual(["east", "west"]);
    expect(westCentred[0]?.left).toBeCloseTo(20);
    expect(westCentred[1]?.left).toBeCloseTo(70);
  });

  it("fits date-line points on their short arc instead of centring the map away from them", () => {
    const fitted = fitView(
      [entry("east", 0, 175), entry("west", 0, -175)],
      { lat: 0, lng: 179 },
    );
    expect(Math.abs(Math.abs(fitted.lng) - 180)).toBeCloseTo(0);
    expect(fitted.spanLng).toBeLessThan(20);
  });

  it("does not render non-finite or out-of-range coordinates as pins", () => {
    const placed = placeEntries(
      [
        entry("valid", 0, 0),
        entry("nan-lat", Number.NaN, 0),
        entry("infinite-lng", 0, Number.POSITIVE_INFINITY),
        entry("bad-lat", 91, 0),
        entry("bad-lng", 0, 181),
      ],
      { lat: 0, lng: 0, spanLat: 10, spanLng: 10 },
    );
    expect(placed.map((item) => item.entry.id)).toEqual(["valid"]);
  });

  it("clusters overlapping pins deterministically", () => {
    const placed = placeEntries(
      [entry("a", 52.43, -1.89), entry("b", 52.4302, -1.8902), entry("c", 52.46, -1.86)],
      view,
    );
    const clusters = clusterPlaced(placed, 8);
    expect(clusters.reduce((n, c) => n + c.entries.length, 0)).toBe(3);
    expect(clusters.some((c) => c.entries.length === 2)).toBe(true);
    expect(clusterPlaced(placed, 8)).toEqual(clusters);
  });

  it("clusters close pins across grid boundaries when touch areas overlap", () => {
    const placed = [
      { entry: entry("a", 52.43, -1.89), left: 9.5, top: 20 },
      { entry: entry("b", 52.4302, -1.8902), left: 10.5, top: 20 },
      { entry: entry("c", 52.46, -1.86), left: 16, top: 20 },
    ];
    const clusters = clusterPlaced(placed, 2, 2);
    expect(clusters).toHaveLength(2);
    expect(
      clusters.find((cluster) => cluster.entries.length === 2)?.entries.map((e) => e.id),
    ).toEqual(["a", "b"]);
    expect(clusterPlaced(placed, 2, 2)).toEqual(clusters);
  });

  it("fits a locality with no activity at all", () => {
    const fitted = fitView([], { lat: 52.43, lng: -1.89 });
    expect(fitted.lat).toBeCloseTo(52.43);
    const bounds = boundsOf(fitted);
    expect(bounds.maxLat).toBeGreaterThan(bounds.minLat);
  });

  it("describes the scale it is showing", () => {
    expect(scaleOf({ ...view, spanLat: 0.02 })).toBe("neighbourhood");
    expect(scaleOf({ ...view, spanLat: 0.4 })).toBe("city");
    expect(scaleOf({ ...view, spanLat: 2 })).toBe("region");
    expect(scaleOf({ ...view, spanLat: 10 })).toBe("country");
    expect(scaleOf({ ...view, spanLat: 40 })).toBe("world");
  });
});
