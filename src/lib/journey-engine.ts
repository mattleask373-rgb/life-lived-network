/**
 * Journey engine.
 *
 * Deliberately deterministic for the first prototype. It only ever arranges
 * entries that genuinely exist in the data — it never invents a place, a person
 * or an event, and it labels anything unverified.
 *
 * The shape below (`planJourney`) is the seam where a real AI service can be
 * dropped in later without any UI change.
 */

import { money } from "@/components/layer-colour";
import { type LayerId, type TimeBand, type WorldEntry } from "./world-data";

export interface JourneyBrief {
  days: number;
  budget: number;
  interests: LayerId[];
  wantsPaidWork: boolean;
  social: "quiet" | "friendly" | "lively";
}

export interface JourneyStep {
  band: TimeBand;
  bandLabel: string;
  entry: WorldEntry;
  why: string;
}

export interface Journey {
  name: string;
  idea: string;
  steps: JourneyStep[];
  spend: number;
  earn: number;
  uncertain: string[];
}

const BAND_ORDER: { band: TimeBand; label: string }[] = [
  { band: "now", label: "Now" },
  { band: "today", label: "This afternoon" },
  { band: "tonight", label: "Tonight" },
  { band: "tomorrow", label: "Tomorrow" },
  { band: "weekend", label: "At the weekend" },
];

const SHAPES: { name: string; idea: string; priority: LayerId[] }[] = [
  {
    name: "The creative one",
    idea: "Music, makers and rooms that need something happening in them.",
    priority: ["music", "art", "experience", "community"],
  },
  {
    name: "Work and adventure",
    idea: "Earn a bit, sleep well, get outside between shifts.",
    priority: ["work", "nature", "experience", "food"],
  },
  {
    name: "The community one",
    idea: "Local people, shared tables, hands where they're needed.",
    priority: ["community", "people", "food", "experience"],
  },
  {
    name: "The slow one",
    idea: "Walking, water, small rooms, nothing rushed.",
    priority: ["nature", "food", "people", "experience"],
  },
];

function pick(
  band: TimeBand,
  priority: LayerId[],
  brief: JourneyBrief,
  used: Set<string>,
  world: WorldEntry[],
): WorldEntry | undefined {
  const pool = world.filter((e) => e.band === band && !used.has(e.id));
  const scored = pool
    .map((e) => {
      let score = 0;
      const p = priority.indexOf(e.layer);
      score += p === -1 ? 12 : p * 2;
      if (brief.interests.includes(e.layer)) score -= 6;
      if (brief.wantsPaidWork && e.cost < 0) score -= 8;
      if (e.cost > brief.budget) score += 20;
      if (e.social !== brief.social) score += 2;
      if (!e.verified) score += 1;
      return { e, score };
    })
    .sort((a, b) => a.score - b.score);
  return scored[0]?.e;
}

function buildShape(
  shape: (typeof SHAPES)[number],
  brief: JourneyBrief,
  world: WorldEntry[],
): Journey {
  const used = new Set<string>();
  const steps: JourneyStep[] = [];
  const bands = BAND_ORDER.slice(0, Math.max(3, Math.min(5, brief.days + 2)));

  for (const { band, label } of bands) {
    const entry = pick(band, shape.priority, brief, used, world);
    if (!entry) continue;
    used.add(entry.id);
    steps.push({
      band,
      bandLabel: label,
      entry,
      why: reason(entry, brief),
    });
  }

  const spend = steps.reduce((n, s) => n + Math.max(0, s.entry.cost), 0);
  const earn = steps.reduce((n, s) => n + Math.max(0, -s.entry.cost), 0);
  const uncertain = steps.filter((s) => !s.entry.verified).map((s) => s.entry.title);

  return { name: shape.name, idea: shape.idea, steps, spend, earn, uncertain };
}

function reason(entry: WorldEntry, brief: JourneyBrief): string {
  if (entry.cost < 0) return `${money(entry.cost, entry.currency)} the same day.`;
  if (brief.interests.includes(entry.layer) && entry.give)
    return `You said this interests you — and there's something to give here.`;
  if (brief.interests.includes(entry.layer)) return "You said this interests you.";
  if (entry.cost === 0) return "Costs nothing, and it's near the rest of your day.";
  if (entry.give) return "There's something useful you could do here.";
  return "It fits the time and the place.";
}

/**
 * Journeys arranged from the entities handed in — nothing else. No data source,
 * no demo constants: real listings, fixtures, cached or future provider records
 * all work here unchanged. An empty world honestly yields no journeys.
 */
export function planJourney(brief: JourneyBrief, world: WorldEntry[]): Journey[] {
  const pool = world;
  return SHAPES.map((shape) => buildShape(shape, brief, pool))
    .filter((j) => j.steps.length >= 2)
    .sort((a, b) => {
      const aFit = a.steps.filter((s) => brief.interests.includes(s.entry.layer)).length;
      const bFit = b.steps.filter((s) => brief.interests.includes(s.entry.layer)).length;
      return bFit - aFit;
    });
}

export interface HoursBrief {
  minutes: number;
  spend: number;
  outdoors: boolean;
  social: "quiet" | "friendly" | "lively";
  interests: LayerId[];
}

/** "I have three hours." Returns a small handful from the supplied world. */
export function whatIsPossible(brief: HoursBrief, world: WorldEntry[]): WorldEntry[] {
  return world
    .filter((e) => e.minutes > 0)
    .filter((e) => e.minutes <= brief.minutes + 30)
    .filter((e) => Math.max(0, e.cost) <= brief.spend)
    .filter((e) => (brief.outdoors ? e.outdoors : true))
    .map((e) => {
      let score = 0;
      if (brief.interests.length && !brief.interests.includes(e.layer)) score += 10;
      if (e.social !== brief.social) score += 3;
      score += Math.abs(brief.minutes - e.minutes) / 60;
      return { e, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((r) => r.e);
}
