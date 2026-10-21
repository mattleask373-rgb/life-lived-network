import { describe, expect, it } from "vitest";

import {
  assertGeoBounds,
  assertQueryableGeoBounds,
  geoBoundsForViewport,
  isGeoBounds,
  isGeoBoundsQueryable,
  isViewportQueryable,
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

  it("allows bounded viewport queries at the exact configured limits", () => {
    expect(isViewportQueryable({ lat: 51.5, lng: -1.9, spanLat: 1.5, spanLng: 2.1 })).toBe(true);
  });

  it.each([
    { lat: 51.5, lng: -1.9, spanLat: 1.5001, spanLng: 2.1 },
    { lat: 51.5, lng: -1.9, spanLat: 1.5, spanLng: 2.1001 },
    { lat: 51.5, lng: -1.9, spanLat: 12, spanLng: 16.8 },
    { lat: Number.NaN, lng: -1.9, spanLat: 1, spanLng: 1.4 },
    { lat: 51.5, lng: 181, spanLat: 1, spanLng: 1.4 },
    { lat: 51.5, lng: -1.9, spanLat: 0, spanLng: 1.4 },
  ])("rejects broad or invalid viewport queries: %s", (view) => {
    expect(isViewportQueryable(view)).toBe(false);
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

  it("allows only queryable server bounds, including the exact span caps", () => {
    const bounds = { minLat: 50, maxLat: 51.5, minLng: -2, maxLng: 0.1 };
    expect(isGeoBoundsQueryable(bounds)).toBe(true);
    expect(() => assertQueryableGeoBounds(bounds)).not.toThrow();
  });

  it.each([
    { minLat: -90, maxLat: 90, minLng: -180, maxLng: 180 },
    { minLat: 50, maxLat: 51.5001, minLng: -2, maxLng: -1 },
    { minLat: 50, maxLat: 51, minLng: -2, maxLng: 0.1001 },
    { minLat: 0, maxLat: 1, minLng: 179, maxLng: -178.8 },
  ])("rejects coordinate-valid but over-wide server bounds: %s", (bounds) => {
    expect(isGeoBounds(bounds)).toBe(true);
    expect(isGeoBoundsQueryable(bounds)).toBe(false);
    expect(() => assertQueryableGeoBounds(bounds)).toThrow(
      "Geographic viewport exceeds the maximum queryable bounds.",
    );
  });

  it("correctly measures a narrow antimeridian-crossing query", () => {
    const bounds = { minLat: -0.5, maxLat: 0.5, minLng: 179, maxLng: -179.5 };
    expect(isGeoBoundsQueryable(bounds)).toBe(true);
    expect(() => assertQueryableGeoBounds(bounds)).not.toThrow();
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
});
