/**
 * Intents — "Do something today" and "Why not?".
 *
 * A thin, deterministic layer on top of whatever real entries exist. It never
 * invents anything: it only arranges what the world already contains, and says
 * plainly when there's nothing worth suggesting.
 *
 * Ranking is delegated to grounded-matching so locality, service and time-intent
 * experiences share one evidence-backed path. The public API stays stable so
 * existing UI components need no change.
 */

import type { LayerId, WorldEntry } from "./world-data";
import { groundedMatch, queryFromIntent } from "./grounded-matching";

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

/**
 * A few real possibilities for today. Never a wall of results.
 *
 * Public contract unchanged: returns WorldEntry[] (empty when nothing eligible).
 * Ranking and eligibility are handled by groundedMatch so the same rules apply
 * across locality, service and intent surfaces.
 */
export function doSomethingToday(all: WorldEntry[], intent: Intent): WorldEntry[] {
  // Prefer items that are actually "today" when enough exist; otherwise use the full pool.
  // groundedMatch already drops demonstration + expired.
  const today = all.filter((e) => TODAY_BANDS.has(e.band));
  const pool = today.length >= 3 ? today : all;

  const outcome = groundedMatch(pool, {
    ...queryFromIntent(intent),
    limit: 12, // enough headroom before variety filter
  });

  if (outcome.kind === "quiet") return [];

  // Preserve the established "one per layer, at most three" presentation so the
  // existing DoSomethingToday UI still feels varied rather than repetitive.
  const seen = new Set<LayerId>();
  const out: WorldEntry[] = [];
  for (const { entry } of outcome.matches) {
    if (seen.has(entry.layer) && out.length < 3) continue;
    seen.add(entry.layer);
    out.push(entry);
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
    .filter((e) => e.quality !== "expired" && !e.demonstration && !savedIds.includes(e.id))
    .filter((e) => e.priceKnown !== false && e.cost <= 20)
    .sort((a, b) => {
      const aNew = savedLayers.has(a.layer) ? 1 : 0;
      const bNew = savedLayers.has(b.layer) ? 1 : 0;
      if (aNew !== bNew) return aNew - bNew;
      return a.title.localeCompare(b.title);
    });
  if (!candidates.length) return undefined;
  return candidates[nudge % candidates.length];
}
