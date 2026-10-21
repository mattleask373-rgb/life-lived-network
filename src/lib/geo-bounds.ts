/**
 * A rectangular, place-level map viewport.
 *
 * Longitudes may cross the antimeridian: minLng > maxLng means the visible
 * interval wraps across +180/-180. Coordinates describe public listing places,
 * never a person's live location or private address.
 */
export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface GeoViewport {
  lat: number;
  lng: number;
  spanLat: number;
  spanLng: number;
}

export function isGeoBounds(value: unknown): value is GeoBounds {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const { minLat, maxLat, minLng, maxLng } = candidate;
  return (
    typeof minLat === "number" &&
    Number.isFinite(minLat) &&
    typeof maxLat === "number" &&
    Number.isFinite(maxLat) &&
    typeof minLng === "number" &&
    Number.isFinite(minLng) &&
    typeof maxLng === "number" &&
    Number.isFinite(maxLng) &&
    minLat >= -90 &&
    maxLat <= 90 &&
    minLat < maxLat &&
    minLng >= -180 &&
    minLng <= 180 &&
    maxLng >= -180 &&
    maxLng <= 180 &&
    minLng !== maxLng
  );
}

/** Reject invalid client-supplied bounds instead of silently widening the read. */
export function assertGeoBounds(value: unknown): asserts value is GeoBounds {
  if (!isGeoBounds(value)) {
    throw new TypeError("Invalid geographic viewport bounds.");
  }
}

function normaliseLongitude(longitude: number): number {
  return (((longitude + 180) % 360) + 360) % 360 - 180;
}

/**
 * Convert a map view into queryable latitude/longitude bounds. Latitude is
 * clipped to the real poles and longitude is normalised so antimeridian
 * crossings are represented explicitly rather than as out-of-range numbers.
 */
export function geoBoundsForViewport(view: GeoViewport): GeoBounds {
  if (
    !Number.isFinite(view.lat) ||
    view.lat < -90 ||
    view.lat > 90 ||
    !Number.isFinite(view.lng) ||
    view.lng < -180 ||
    view.lng > 180 ||
    !Number.isFinite(view.spanLat) ||
    view.spanLat <= 0 ||
    view.spanLat >= 180 ||
    !Number.isFinite(view.spanLng) ||
    view.spanLng <= 0 ||
    view.spanLng >= 360
  ) {
    throw new TypeError("Invalid map viewport.");
  }

  const bounds: GeoBounds = {
    minLat: Math.max(-90, view.lat - view.spanLat / 2),
    maxLat: Math.min(90, view.lat + view.spanLat / 2),
    minLng: normaliseLongitude(view.lng - view.spanLng / 2),
    maxLng: normaliseLongitude(view.lng + view.spanLng / 2),
  };
  assertGeoBounds(bounds);
  return bounds;
}

/** Whether a valid longitude is inside a non-wrapping or antimeridian viewport. */
export function longitudeInBounds(longitude: number, bounds: GeoBounds): boolean {
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return false;
  return bounds.minLng <= bounds.maxLng
    ? longitude >= bounds.minLng && longitude <= bounds.maxLng
    : longitude >= bounds.minLng || longitude <= bounds.maxLng;
}
