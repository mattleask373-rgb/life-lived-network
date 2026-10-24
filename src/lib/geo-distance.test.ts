import { describe, expect, it } from "vitest";

import { distanceKm } from "./geo-distance";

describe("pure geographic distance", () => {
  it("computes straight-line distance across the international date line", () => {
    const distance = distanceKm({ lat: 0, lng: 179.5 }, { lat: 0, lng: -179.5 });

    expect(distance).toBe(111.2);
  });

  it("returns zero for the same point and null for unknown or invalid coordinates", () => {
    expect(distanceKm({ lat: 35.68, lng: 139.69 }, { lat: 35.68, lng: 139.69 })).toBe(0);
    expect(distanceKm({ lat: null, lng: 0 }, { lat: 0, lng: 0 })).toBeNull();
    expect(distanceKm({ lat: Number.NaN, lng: 0 }, { lat: 0, lng: 0 })).toBeNull();
    expect(distanceKm({ lat: 91, lng: 0 }, { lat: 0, lng: 0 })).toBeNull();
    expect(distanceKm({ lat: 0, lng: 181 }, { lat: 0, lng: 0 })).toBeNull();
  });
});
