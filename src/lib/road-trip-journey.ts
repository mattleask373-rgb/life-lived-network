import type { RoutePlan, TravelMode } from "./road-trip";
import type { WorldEntry } from "./world-data";

export const ROAD_TRIP_DRAFT_KEY = "living-world:road-trip-draft:v2";
export const LEGACY_ROAD_TRIP_DRAFT_KEY = "living-world:road-trip-draft:v1";

export interface RoadTripDraft {
  version: 2;
  fromId: string;
  toId: string;
  mode: TravelMode;
  date: string;
  interests: string[];
  stopIds: string[];
  stopEntries: WorldEntry[];
}

export function draftFromPlan(
  plan: RoutePlan,
  stopIds: string[],
  entries: Record<string, WorldEntry> = {},
): RoadTripDraft {
  const uniqueStopIds = uniqueIds(stopIds);
  return {
    version: 2,
    fromId: plan.from.id,
    toId: plan.to.id,
    mode: plan.mode,
    date: plan.date ?? "",
    interests: [...plan.interests],
    stopIds: uniqueStopIds,
    stopEntries: uniqueStopIds.map((id) => entries[id]).filter(isWorldEntry),
  };
}

export function readRoadTripDraft(raw: string | null): RoadTripDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<RoadTripDraft>;
    if (
      value.version !== 2 ||
      typeof value.fromId !== "string" ||
      typeof value.toId !== "string" ||
      !isTravelMode(value.mode) ||
      typeof value.date !== "string" ||
      !Array.isArray(value.interests) ||
      !value.interests.every((item) => typeof item === "string") ||
      !Array.isArray(value.stopIds) ||
      !value.stopIds.every((item) => typeof item === "string") ||
      !Array.isArray(value.stopEntries) ||
      !value.stopEntries.every(isWorldEntry)
    ) {
      return null;
    }
    const stopIds = uniqueIds(value.stopIds);
    const allowed = new Set(stopIds);
    const stopEntries = value.stopEntries.filter((entry) => allowed.has(entry.id));
    return { ...value, stopIds, stopEntries } as RoadTripDraft;
  } catch {
    return null;
  }
}

export function readStoredRoadTripDraft(storage: Pick<Storage, "getItem" | "removeItem">) {
  try {
    const current = readRoadTripDraft(storage.getItem(ROAD_TRIP_DRAFT_KEY));
    if (current) return current;
    storage.removeItem(LEGACY_ROAD_TRIP_DRAFT_KEY);
    return null;
  } catch {
    return null;
  }
}

export function writeRoadTripDraft(
  storage: Pick<Storage, "setItem">,
  draft: RoadTripDraft,
): boolean {
  try {
    storage.setItem(ROAD_TRIP_DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function addJourneyStop(stopIds: string[], id: string): string[] {
  return stopIds.includes(id) ? stopIds : [...stopIds, id];
}

export function hasJourneyStop(stopIds: string[], id: string): boolean {
  return stopIds.includes(id);
}

export function removeJourneyStop(stopIds: string[], id: string): string[] {
  return stopIds.filter((stopId) => stopId !== id);
}

export function moveJourneyStop(stopIds: string[], id: string, direction: "up" | "down"): string[] {
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
  return (
    value === "driving" ||
    value === "walking" ||
    value === "cycling" ||
    value === "public_transport"
  );
}

function isWorldEntry(value: unknown): value is WorldEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<WorldEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.title === "string" &&
    typeof entry.layer === "string"
  );
}
