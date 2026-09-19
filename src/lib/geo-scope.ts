/**
 * Where a need can honestly reach.
 *
 * The world has a hierarchy — country, region, county, city, town, village,
 * neighbourhood — and a need sits at one point in it. This module turns that
 * one point into the two sets the matching rules are allowed to use, and
 * nothing more:
 *
 *   localPlaceIds   the need's place and everywhere inside it. Living here is
 *                   genuinely being here.
 *   serviceScopeIds the need's place, everywhere inside it, and the places it
 *                   sits inside. Someone may state that they cover a whole
 *                   county; that legitimately reaches a town in it.
 *
 * The distinction matters: living in a county is not the same as working in
 * one of its villages, so a person whose only link is a parent place needs a
 * stated service area before they appear.
 *
 * Pure, so the same rules run in tests, on the server and with fixtures.
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
  kind: "lives_here" | "stated_service_area";
}

/**
 * Does this person reach the need's place at all? Passing through somewhere is
 * deliberately excluded — that is a journey, handled separately, and it is
 * never treated as working there.
 */
export function geographicReach(
  person: { placeId: string | null; serviceAreaPlaceIds: string[] },
  geo: NeedGeography,
): GeographicReach | null {
  if (!geo.placeId) return null;
  if (person.placeId && geo.localPlaceIds.includes(person.placeId)) {
    return { kind: "lives_here", reason: "Lives in this area" };
  }
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
