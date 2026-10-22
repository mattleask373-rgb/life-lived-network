import type { Need } from "./needs";
import { toScreen, type MapView } from "./map-view";

export type MapNeed = Pick<Need, "id" | "title" | "placeText" | "lat" | "lng">;

export interface PlacedMapNeed {
  need: MapNeed;
  left: number;
  top: number;
}

export interface MapNeedCluster {
  key: string;
  left: number;
  top: number;
  needs: MapNeed[];
}

/** Only public needs with valid, place-level coordinates can become map pins. */
export function placeNeedsForMap(
  needs: readonly MapNeed[],
  view: MapView,
  limit = 300,
): PlacedMapNeed[] {
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new RangeError("Map need limit must be a positive safe integer");
  }

  const placed: PlacedMapNeed[] = [];
  const seen = new Set<string>();
  for (const need of needs) {
    if (seen.has(need.id)) continue;
    seen.add(need.id);
    if (
      typeof need.lat !== "number" ||
      !Number.isFinite(need.lat) ||
      need.lat < -90 ||
      need.lat > 90 ||
      typeof need.lng !== "number" ||
      !Number.isFinite(need.lng) ||
      need.lng < -180 ||
      need.lng > 180
    ) {
      continue;
    }

    const position = toScreen({ lat: need.lat, lng: need.lng }, view);
    if (
      position.left < -4 ||
      position.left > 104 ||
      position.top < -4 ||
      position.top > 104
    ) {
      continue;
    }
    placed.push({ need, ...position });
    if (placed.length >= limit) break;
  }
  return placed;
}

/**
 * Join need pins whose hit targets would overlap. The spatial buckets avoid
 * comparing every pair, and the output order/key is deterministic.
 */
export function clusterMapNeeds(
  placed: readonly PlacedMapNeed[],
  cellX = 8,
  cellY = cellX,
): MapNeedCluster[] {
  if (!Number.isFinite(cellX) || cellX <= 0 || !Number.isFinite(cellY) || cellY <= 0) {
    throw new RangeError("Map need cluster cells must be positive finite numbers");
  }
  if (placed.length === 0) return [];

  const parents = placed.map((_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (parents[root] !== root) root = parents[root]!;
    while (parents[index] !== index) {
      const next = parents[index]!;
      parents[index] = root;
      index = next;
    }
    return root;
  };
  const join = (a: number, b: number) => {
    const left = find(a);
    const right = find(b);
    if (left !== right) parents[right] = left;
  };

  const buckets = new Map<string, number[]>();
  placed.forEach((item, index) => {
    const x = Math.floor(item.left / cellX);
    const y = Math.floor(item.top / cellY);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const nearby = buckets.get(`${x + dx}:${y + dy}`) ?? [];
        for (const otherIndex of nearby) {
          const other = placed[otherIndex];
          if (
            other &&
            Math.abs(item.left - other.left) < cellX &&
            Math.abs(item.top - other.top) < cellY
          ) {
            join(index, otherIndex);
          }
        }
      }
    }
    const key = `${x}:${y}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(index);
    buckets.set(key, bucket);
  });

  const groups = new Map<number, PlacedMapNeed[]>();
  placed.forEach((item, index) => {
    const root = find(index);
    const group = groups.get(root) ?? [];
    group.push(item);
    groups.set(root, group);
  });

  return [...groups.values()]
    .map((group) => {
      const needs = group.map((item) => item.need).sort((a, b) => a.id.localeCompare(b.id));
      return {
        key: needs.map((need) => need.id).join("|"),
        left: group.reduce((sum, item) => sum + item.left, 0) / group.length,
        top: group.reduce((sum, item) => sum + item.top, 0) / group.length,
        needs,
      };
    })
    .sort((a, b) => a.top - b.top || a.left - b.left || a.key.localeCompare(b.key));
}
