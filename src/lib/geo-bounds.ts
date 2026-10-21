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

/** Maximum latitude or longitude span allowed for a server-side viewport read. */
export const MAX_VIEWPORT_QUERY_SPAN_DEGREES = 1.5;

function longitudeSpanDegrees(bounds: GeoBounds): number {
  return bounds.minLng <= bounds.maxLng
    ? bounds.maxLng - bounds.minLng
    : 360 - bounds.minLng + bounds.maxLng;
}

/** A client should fetch viewport records only at a bounded, zoomed-in scale. */
export function isViewportQueryAllowed(view: GeoViewport): boolean {
  if (
    !Number.isFinite(view.lat) ||
    view.lat < -90 ||
    view.lat > 90 ||
    !Number.isFinite(view.lng) ||
    view.lng < -180 ||
    view.lng > 180 ||
    !Number.isFinite(view.spanLat) ||
    view.spanLat <= 0 ||
    view.spanLat > MAX_VIEWPORT_QUERY_SPAN_DEGREES ||
    !Number.isFinite(view.spanLng) ||
    view.spanLng <= 0 ||
    view.spanLng > MAX_VIEWPORT_QUERY_SPAN_DEGREES
  ) {
    return false;
  }

  try {
    const bounds = geoBoundsForViewport(view);
    return (
      bounds.maxLat - bounds.minLat <= MAX_VIEWPORT_QUERY_SPAN_DEGREES &&
      longitudeSpanDegrees(bounds) <= MAX_VIEWPORT_QUERY_SPAN_DEGREES
    );
  } catch {
    return false;
  }
}

/**
 * Enforce a small maximum window at the server boundary too. Client-side zoom
 * checks improve UX, but they are not a security or query-cost boundary.
 */
export function assertViewportQueryBounds(value: unknown): asserts value is GeoBounds {
  assertGeoBounds(value);
  const bounds = value;
  if (
    bounds.maxLat - bounds.minLat > MAX_VIEWPORT_QUERY_SPAN_DEGREES ||
    longitudeSpanDegrees(bounds) > MAX_VIEWPORT_QUERY_SPAN_DEGREES
  ) {
    throw new TypeError("Geographic viewport exceeds the maximum query span.");
  }
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
  const shifted = longitude + 180;
  const wrapped = ((shifted % 360) + 360) % 360;
  return wrapped - 180;
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
