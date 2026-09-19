import type { FreshnessState } from "./capability-freshness";

export type JourneyVisibility = "private" | "friends" | "journey_network" | "public";
export type JourneyStatus = "draft" | "active" | "completed" | "cancelled";

export interface JourneyPlaceContext {
  placeId: string;
  position: number;
  arrivesAt: string | null;
  departsAt: string | null;
}

export interface JourneyContext {
  id: string;
  ownerId: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  visibility: JourneyVisibility;
  opportunityOptIn: boolean;
  status: JourneyStatus;
  lastConfirmedAt: string;
  expiresAt: string | null;
  freshness: FreshnessState;
  places: JourneyPlaceContext[];
}

export function journeyOverlaps(
  journey: JourneyContext,
  placeId: string | null,
  startsAt: string | null,
  endsAt: string | null,
): boolean {
  if (!placeId || journey.visibility !== "public" || !journey.opportunityOptIn || journey.status !== "active") return false;
  const stop = journey.places.find((item) => item.placeId === placeId);
  if (!stop) return false;
  if (!startsAt) return true;
  const needStart = Date.parse(startsAt);
  const needEnd = Date.parse(endsAt ?? startsAt);
  const routeStart = Date.parse(stop.arrivesAt ?? journey.startsAt ?? "");
  const routeEnd = Date.parse(stop.departsAt ?? journey.endsAt ?? stop.arrivesAt ?? journey.startsAt ?? "");
  return Number.isFinite(routeStart) && Number.isFinite(routeEnd) && routeStart <= needEnd && routeEnd >= needStart;
}
