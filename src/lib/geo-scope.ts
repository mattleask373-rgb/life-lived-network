/**
 * Where a need can honestly reach.
 *
 * A person's residence is not service coverage. The engine only treats a
 * person as geographically relevant to a need when they have explicitly
 * stated a service area that reaches it. Passing through somewhere is a
 * separate journey signal and is never treated as working there.
 */

import { ancestorsOf, descendantIdsOf, type PlaceIndex } from "./places";

export interface NeedGeography {
  placeId: string | null;
  localPlaceIds: string[];
  serviceScopeIds: string[];
}

export function needGeography(index: PlaceIndex, placeId: string | null): NeedGeography {
  if (!placeId) return { placeId: null, localPlaceIds: [], serviceScopeIds: [] };
  const local = descendantIdsOf(index, placeId);
  const scope = [...new Set([...local, ...ancestorsOf(index, placeId).map((p) => p.id)])];
  return { placeId, localPlaceIds: local, serviceScopeIds: scope };
}

/** The simplest possible geography: exactly this place, nothing around it. */
export function exactGeography(placeId: string | null): NeedGeography {
  if (!placeId) return { placeId: null, localPlaceIds: [], serviceScopeIds: [] };
  return { placeId, localPlaceIds: [placeId], serviceScopeIds: [placeId] };
}

export interface GeographicReach {
  /** How they reach it, in plain words, for the evidence list. */
  reason: string;
  kind: "stated_service_area";
}

/**
 * Does this person reach the need's place at all?
 *
 * Residence is deliberately not enough. A person must explicitly state a
 * service area. Passing through somewhere is a journey, handled separately.
 */
export function geographicReach(
  person: { placeId: string | null; serviceAreaPlaceIds: string[] },
  geo: NeedGeography,
): GeographicReach | null {
  if (!geo.placeId) return null;
  if (person.serviceAreaPlaceIds.some((id) => geo.serviceScopeIds.includes(id))) {
    return {
      kind: "stated_service_area",
      reason: "This falls inside an area they said they cover",
    };
  }
  return null;
}

/** A listing or hour offer sits in scope when its place is inside the need's place. */
export function entryInScope(entryPlaceId: string | null, geo: NeedGeography): boolean {
  if (!geo.placeId) return true;
  if (!entryPlaceId) return true;
  return geo.localPlaceIds.includes(entryPlaceId);
}
