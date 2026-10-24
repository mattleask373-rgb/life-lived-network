/**
 * Pure straight-line distance math shared by global geography and discovery.
 *
 * This module has no database or browser dependencies so the world-domain
 * helpers can use real coordinates without importing the Supabase-backed place
 * registry.
 */
export interface GeographicCoordinates {
  lat: number | null;
  lng: number | null;
}

function validCoordinates(point: GeographicCoordinates): boolean {
  return (
    typeof point.lat === "number" &&
    Number.isFinite(point.lat) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    typeof point.lng === "number" &&
    Number.isFinite(point.lng) &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

/** Rough straight-line distance in kilometres; unknown/invalid coordinates stay unknown. */
export function distanceKm(a: GeographicCoordinates, b: GeographicCoordinates): number | null {
  if (!validCoordinates(a) || !validCoordinates(b)) return null;

  const latA = (a.lat as number) * (Math.PI / 180);
  const latB = (b.lat as number) * (Math.PI / 180);
  const dLat = latB - latA;
  const dLng = (((b.lng as number) - (a.lng as number)) * Math.PI) / 180;
  const haversine =
    Math.sin(dLat / 2) ** 2 + Math.cos(latA) * Math.cos(latB) * Math.sin(dLng / 2) ** 2;
  const boundedHaversine = Math.min(1, Math.max(0, haversine));
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(boundedHaversine)) * 10) / 10;
}
