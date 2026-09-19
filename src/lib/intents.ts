/**
 * Intents — "Do something today" and "Why not?".
 *
 * A thin, deterministic layer on top of whatever real entries exist. It never
 * invents anything: it only arranges what the world already contains, and says
 * plainly when there's nothing worth suggesting.
 *
 * Same seam as the journey engine: swap the scoring for an AI service later
 * without changing a single component.
 */

import type { LayerId, WorldEntry } from "./world-data";

export interface Intent {
  id: string;
  label: string;
  blurb: string;
  layers: LayerId[];
  /** Prefer things where there's something to give. */
  give?: boolean;
  /** Prefer things that cost nothing. */
  free?: boolean;
  /** Prefer things that pay. */
  pays?: boolean;
  outdoors?: boolean;
}

export const INTENTS: Intent[] = [
  {
    id: "meet",
    label: "Meet people",
    blurb: "Rooms and tables with room in them",
    layers: ["people", "food", "community"],
  },
  {
    id: "help",
    label: "Help someone",
    blurb: "Hands needed nearby",
    layers: ["community", "nature"],
    give: true,
  },
  {
    id: "learn",
    label: "Learn something",
    blurb: "Someone who knows how",
    layers: ["experience", "art"],
  },
  {
    id: "nature",
    label: "Be outside",
    blurb: "Water, trees, air",
    layers: ["nature"],
    outdoors: true,
  },
  { id: "music", label: "Hear music", blurb: "A room with sound in it", layers: ["music"] },
  {
    id: "work",
    label: "Find work",
    blurb: "Paid hours you could take",
    layers: ["work"],
    pays: true,
  },
  {
    id: "make",
    label: "Create something",
    blurb: "People making things",
    layers: ["art", "experience"],
  },
  { id: "eat", label: "Eat well", blurb: "Where people actually go", layers: ["food"] },
  { id: "free", label: "Spend nothing", blurb: "Good and free", layers: [], free: true },
  { id: "surprise", label: "Surprise me", blurb: "Something outside your usual", layers: [] },
];

export function intentById(id: string): Intent | undefined {
  return INTENTS.find((i) => i.id === id);
}

const TODAY_BANDS = new Set(["now", "today", "tonight"]);

/** A few real possibilities for today. Never a wall of results. */
export function doSomethingToday(all: WorldEntry[], intent: Intent): WorldEntry[] {
  const pool = all.filter((e) => e.quality !== "expired");
  const today = pool.filter((e) => TODAY_BANDS.has(e.band));
  const base = today.length >= 3 ? today : pool;

  const scored = base
    .map((e) => {
      let score = 0;
      if (intent.layers.length && !intent.layers.includes(e.layer)) score += 12;
      if (intent.give && !e.give) score += 6;
      if (intent.free && e.cost > 0) score += 8;
      if (intent.pays && e.cost >= 0) score += 10;
      if (intent.outdoors && !e.outdoors) score += 8;
      if (!TODAY_BANDS.has(e.band)) score += 3;
      if (e.quality === "may have changed") score += 2;
      if (!e.verified) score += 1;
      return { e, score };
    })
    .filter((r) => r.score < 12)
    .sort((a, b) => a.score - b.score);

  // One per layer, so three possibilities feel genuinely different.
  const seen = new Set<LayerId>();
  const out: WorldEntry[] = [];
  for (const { e } of scored) {
    if (seen.has(e.layer) && out.length < 3) continue;
    seen.add(e.layer);
    out.push(e);
    if (out.length === 3) break;
  }
  return out;
}

/**
 * "Why not?" — one real thing outside someone's usual shape.
 * Deliberately not random noise: cheap, soon, and in a layer they haven't saved.
 */
export function whyNot(all: WorldEntry[], savedIds: string[], nudge = 0): WorldEntry | undefined {
  const savedLayers = new Set(all.filter((e) => savedIds.includes(e.id)).map((e) => e.layer));
  const candidates = all
    .filter((e) => e.quality !== "expired" && !savedIds.includes(e.id))
    .filter((e) => e.cost <= 20)
    .sort((a, b) => {
      const aNew = savedLayers.has(a.layer) ? 1 : 0;
      const bNew = savedLayers.has(b.layer) ? 1 : 0;
      if (aNew !== bNew) return aNew - bNew;
      return a.title.localeCompare(b.title);
    });
  if (!candidates.length) return undefined;
  return candidates[nudge % candidates.length];
}
