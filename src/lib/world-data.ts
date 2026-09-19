/**
 * The domain vocabulary of the Living World.
 *
 * Types, layers, honesty labels, and pure helpers — nothing else. There is no
 * data in this file: every helper works on entries it is handed, wherever they
 * came from (database, fixtures, a future provider). Demo entries now live in
 * `fixtures/world-entries.ts`.
 *
 * No AI-generated imagery is used anywhere. Entries carry no photographs; the
 * UI renders neutral, hand-made placeholders instead.
 */

export type LayerId =
  | "work"
  | "experience"
  | "music"
  | "art"
  | "community"
  | "people"
  | "nature"
  | "food";

export type TimeBand = "now" | "today" | "tonight" | "tomorrow" | "weekend";

export interface WorldEntry {
  id: string;
  layer: LayerId;
  title: string;
  /** Human place name, never an exact private address. */
  place: string;
  neighbourhood: string;
  /** Position on the stylised map, 0-100 in each axis. Approximate by design. */
  x: number;
  y: number;
  when: string;
  band: TimeBand;
  /** Minutes a person would realistically give to this. */
  minutes: number;
  /** Cost in euros. 0 means free. Negative means it pays. */
  cost: number;
  summary: string;
  /** Short, plainly-worded details. */
  details: string[];
  /** What a person could give here. */
  give?: string;
  /** Who posted it — a real host on the platform, not a brand voice. */
  host: string;
  verified: boolean;
  social: "quiet" | "friendly" | "lively";
  outdoors: boolean;
  /** True when a real person on the platform posted this, not demo content. */
  community?: boolean;
  /** How trustworthy the information is right now. */
  quality?: DataQuality;
  /** What kind of thing this is, for community-posted entries. */
  kind?: string;
  /** What the person could give, in their own words. */
  skills?: string[];
}

export type DataQuality =
  | "unverified"
  | "community confirmed"
  | "verified"
  | "recently updated"
  | "may have changed"
  | "expired";

export const QUALITY_LABEL: Record<DataQuality, string> = {
  unverified: "Not yet checked — ask before you rely on it",
  "community confirmed": "Confirmed by people who went",
  verified: "Checked",
  "recently updated": "Updated recently",
  "may have changed": "May have changed — worth asking",
  expired: "This has probably passed",
};

export interface Layer {
  id: LayerId;
  label: string;
  glyph: string;
  blurb: string;
}

export const LAYERS: Layer[] = [
  { id: "work", label: "Work", glyph: "🛠", blurb: "Paid hours, near you" },
  { id: "experience", label: "Experiences", glyph: "🧭", blurb: "Learn something real" },
  { id: "music", label: "Music", glyph: "🎵", blurb: "Rooms with sound in them" },
  { id: "art", label: "Artists", glyph: "🎨", blurb: "People making things" },
  { id: "community", label: "Community", glyph: "🤝", blurb: "Places that need hands" },
  { id: "people", label: "People", glyph: "👋", blurb: "Open to meeting someone" },
  { id: "nature", label: "Nature", glyph: "🌲", blurb: "Go outside" },
  { id: "food", label: "Food", glyph: "🥘", blurb: "Tables with room at them" },
];

export function entriesByLayer(entries: WorldEntry[], layers: LayerId[]): WorldEntry[] {
  if (layers.length === 0) return entries;
  return entries.filter((e) => layers.includes(e.layer));
}

export function entryById(entries: WorldEntry[], id: string): WorldEntry | undefined {
  return entries.find((e) => e.id === id);
}

/** Counts per layer for the "Something's happening here" panel, from real data. */
export function activitySnapshot(entries: WorldEntry[]): { layer: Layer; count: number }[] {
  return LAYERS.map((layer) => ({
    layer,
    count: entries.filter((e) => e.layer === layer.id).length,
  })).filter((row) => row.count > 0);
}

/** Things nearby that relate to a given entry, without any ranking magic. */
export function relatedEntries(
  entries: WorldEntry[],
  entry: WorldEntry,
  limit = 3,
): WorldEntry[] {
  return entries
    .filter((e) => e.id !== entry.id)
    .map((e) => {
      const distance = Math.hypot(e.x - entry.x, e.y - entry.y);
      const sameArea = e.neighbourhood === entry.neighbourhood ? -20 : 0;
      const sameBand = e.band === entry.band ? -8 : 0;
      return { e, score: distance + sameArea + sameBand };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((r) => r.e);
}

/**
 * The "Everything" view shows the feeling of a place, not every pin.
 * A couple of things per layer, so the map is alive without being noisy.
 */
export function meaningfulVariety(entries: WorldEntry[], perLayer = 2): WorldEntry[] {
  const count = new Map<LayerId, number>();
  const kept: WorldEntry[] = [];
  for (const e of entries) {
    const n = count.get(e.layer) ?? 0;
    if (n >= perLayer) continue;
    count.set(e.layer, n + 1);
    kept.push(e);
  }
  return kept;
}
