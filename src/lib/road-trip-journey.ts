import type { RoutePlan, TravelMode } from "./road-trip";

export const ROAD_TRIP_DRAFT_KEY = "living-world:road-trip-draft:v1";

export interface RoadTripDraft {
  version: 1;
  fromId: string;
  toId: string;
  mode: TravelMode;
  date: string;
  interests: string[];
  stopIds: string[];
}

export function draftFromPlan(plan: RoutePlan, stopIds: string[]): RoadTripDraft {
  return {
    version: 1,
    fromId: plan.from.id,
    toId: plan.to.id,
    mode: plan.mode,
    date: plan.date ?? "",
    interests: [...plan.interests],
    stopIds: uniqueIds(stopIds),
  };
}

export function readRoadTripDraft(raw: string | null): RoadTripDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<RoadTripDraft>;
    if (
      value.version !== 1 ||
      typeof value.fromId !== "string" ||
      typeof value.toId !== "string" ||
      !isTravelMode(value.mode) ||
      typeof value.date !== "string" ||
      !Array.isArray(value.interests) ||
      !value.interests.every((item) => typeof item === "string") ||
      !Array.isArray(value.stopIds) ||
      !value.stopIds.every((item) => typeof item === "string")
    ) {
      return null;
    }
    return { ...value, stopIds: uniqueIds(value.stopIds) } as RoadTripDraft;
  } catch {
    return null;
  }
}

export function addJourneyStop(stopIds: string[], id: string): string[] {
  return stopIds.includes(id) ? stopIds : [...stopIds, id];
}

export function removeJourneyStop(stopIds: string[], id: string): string[] {
  return stopIds.filter((stopId) => stopId !== id);
}

export function moveJourneyStop(
  stopIds: string[],
  id: string,
  direction: "up" | "down",
): string[] {
  const from = stopIds.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= stopIds.length) return stopIds;
  const next = [...stopIds];
  [next[from], next[to]] = [next[to] as string, next[from] as string];
  return next;
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function isTravelMode(value: unknown): value is TravelMode {
  return value === "driving" || value === "walking" || value === "cycling" || value === "public_transport";
}