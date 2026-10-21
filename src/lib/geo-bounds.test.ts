import { describe, expect, it } from "vitest";

import {
  assertGeoBounds,
  assertViewportQueryBounds,
  geoBoundsForViewport,
  isGeoBounds,
  isViewportQueryAllowed,
  longitudeInBounds,
} from "./geo-bounds";

describe("geographic viewport bounds", () => {
  it("accepts a normal rectangular viewport", () => {
    expect(isGeoBounds({ minLat: 51, maxLat: 52, minLng: -2, maxLng: -1 })).toBe(true);
  });

  it("represents antimeridian-crossing viewports without out-of-range longitudes", () => {
    const bounds = geoBoundsForViewport({
      lat: 0,
      lng: 179,
      spanLat: 10,
      spanLng: 20,
    });

    expect(bounds).toEqual({
      minLat: -5,
      maxLat: 5,
      minLng: 169,
      maxLng: -171,
    });
    expect(longitudeInBounds(175, bounds)).toBe(true);
    expect(longitudeInBounds(-175, bounds)).toBe(true);
    expect(longitudeInBounds(0, bounds)).toBe(false);
  });

  it("clips latitude bounds to the physical poles", () => {
    expect(geoBoundsForViewport({ lat: 88, lng: 0, spanLat: 10, spanLng: 10 })).toEqual({
      minLat: 83,
      maxLat: 90,
      minLng: -5,
      maxLng: 5,
    });
  });

  it.each([
    null,
    [],
    {},
    { minLat: Number.NaN, maxLat: 52, minLng: -2, maxLng: -1 },
    { minLat: 52, maxLat: 51, minLng: -2, maxLng: -1 },
    { minLat: -91, maxLat: 52, minLng: -2, maxLng: -1 },
    { minLat: 51, maxLat: 52, minLng: -181, maxLng: -1 },
    { minLat: 51, maxLat: 52, minLng: -2, maxLng: -2 },
  ])("rejects invalid bounds: %s", (candidate) => {
    expect(isGeoBounds(candidate)).toBe(false);
    expect(() => assertGeoBounds(candidate)).toThrow("Invalid geographic viewport bounds.");
  });

  it("rejects non-finite or impossible map viewport values", () => {
    expect(() =>
      geoBoundsForViewport({
        lat: 0,
        lng: 0,
        spanLat: Number.POSITIVE_INFINITY,
        spanLng: 1,
      }),
    ).toThrow("Invalid map viewport.");
  });

  it("allows viewport queries only for small, zoomed-in rectangles", () => {
    const compactView = { lat: 52.4, lng: -1.9, spanLat: 0.8, spanLng: 1.2 };
    expect(isViewportQueryAllowed(compactView)).toBe(true);
    expect(isViewportQueryAllowed({ ...compactView, spanLat: 1.6 })).toBe(false);
    expect(isViewportQueryAllowed({ ...compactView, spanLng: 1.6 })).toBe(false);
    expect(isViewportQueryAllowed({ ...compactView, spanLat: Number.NaN })).toBe(false);
  });

  it("accepts a narrow antimeridian query but rejects a broad wrapped interval", () => {
    expect(() =>
      assertViewportQueryBounds({ minLat: -0.2, maxLat: 0.2, minLng: 179.7, maxLng: -179.7 }),
    ).not.toThrow();

    expect(() =>
      assertViewportQueryBounds({ minLat: -0.2, maxLat: 0.2, minLng: 170, maxLng: -170 }),
    ).toThrow("Geographic viewport exceeds the maximum query span.");
  });

  it("rejects broad bounds on the server-side viewport boundary", () => {
    expect(() =>
      assertViewportQueryBounds({ minLat: 50, maxLat: 52, minLng: -2, maxLng: -1 }),
    ).toThrow("Geographic viewport exceeds the maximum query span.");
  });
});
