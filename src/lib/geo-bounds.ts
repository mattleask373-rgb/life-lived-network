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

/**
 * Only query a map rectangle when it is sufficiently local to remain a
 * bounded discovery request. The longitude allowance keeps the intended
 * ~1.4:1 map-frame aspect ratio while limiting the latitude span to 1.5°.
 */
export const MAX_QUERYABLE_SPAN_LAT = 1.5;
export const MAX_QUERYABLE_SPAN_LNG = 2.1;

export function isViewportQueryable(view: GeoViewport): boolean {
  return (
    Number.isFinite(view.lat) &&
    view.lat >= -90 &&
    view.lat <= 90 &&
    Number.isFinite(view.lng) &&
    view.lng >= -180 &&
    view.lng <= 180 &&
    Number.isFinite(view.spanLat) &&
    view.spanLat > 0 &&
    view.spanLat <= MAX_QUERYABLE_SPAN_LAT &&
    Number.isFinite(view.spanLng) &&
    view.spanLng > 0 &&
    view.spanLng <= MAX_QUERYABLE_SPAN_LNG
  );
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

/**
 * A valid rectangle can still be too expensive for a viewport lookup.
 * Apply the same span cap on the server, where browser checks can be bypassed.
 * Wrapped longitudes cross the antimeridian (for example 179° to -179°).
 */
export function isGeoBoundsQueryable(value: unknown): value is GeoBounds {
  if (!isGeoBounds(value)) return false;

  const latitudeSpan = value.maxLat - value.minLat;
  const longitudeSpan =
    value.minLng <= value.maxLng
      ? value.maxLng - value.minLng
      : 360 - (value.minLng - value.maxLng);

  return (
    latitudeSpan > 0 &&
    latitudeSpan <= MAX_QUERYABLE_SPAN_LAT &&
    longitudeSpan > 0 &&
    longitudeSpan <= MAX_QUERYABLE_SPAN_LNG
  );
}

/** Reject invalid client-supplied bounds instead of silently widening the read. */
export function assertGeoBounds(value: unknown): asserts value is GeoBounds {
  if (!isGeoBounds(value)) {
    throw new TypeError("Invalid geographic viewport bounds.");
  }
}

/** Reject valid but unbounded rectangles before they reach the database query. */
export function assertQueryableGeoBounds(value: unknown): asserts value is GeoBounds {
  assertGeoBounds(value);
  if (!isGeoBoundsQueryable(value)) {
    throw new TypeError("Geographic viewport exceeds the maximum queryable bounds.");
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
