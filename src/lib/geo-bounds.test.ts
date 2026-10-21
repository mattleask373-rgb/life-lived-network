import { describe, expect, it } from "vitest";

import {
  assertGeoBounds,
  geoBoundsForViewport,
  isGeoBounds,
  longitudeInBounds,
} from "./geo-bounds";

describe("geographic viewport bounds", () => {
  it("accepts a normal rectangular viewport", () => {
    expect(
      isGeoBounds({ minLat: 51, maxLat: 52, minLng: -2, maxLng: -1 }),
    ).toBe(true);
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
    expect(
      geoBoundsForViewport({ lat: 88, lng: 0, spanLat: 10, spanLng: 10 }),
    ).toEqual({
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
    expect(() => assertGeoBounds(candidate)).toThrow(
      "Invalid geographic viewport bounds.",
    );
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
