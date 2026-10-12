/**
 * Search context that survives navigation.
 *
 * Free text from the front door becomes (a) an exact locality, if one is
 * named unambiguously, and (b) the remaining words, kept verbatim in the URL.
 * This is not matching: the remaining words are only ever used as a plain,
 * visible text filter over entries the locality page has already loaded.
 */

import { splitPlaceFromQuery, type Place, type PlaceIndex } from "./places";
import type { WorldEntry } from "./world-data";

const MAX = 200;

export interface QuerySearch {
  /** The words left after the place was taken out. */
  q?: string;
  /** Everything the person originally typed. */
  from?: string;
}

function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim().replace(/\s+/g, " ").slice(0, MAX);
  return v || undefined;
}

/** validateSearch for routes that accept retained search text. */
export function parseQuerySearch(raw: Record<string, unknown>): QuerySearch {
  const out: QuerySearch = {};
  const q = clean(raw["q"]);
  const from = clean(raw["from"]);
  if (q) out.q = q;
  if (from) out.from = from;
  return out;
}

export interface LocalityTarget {
  params: { country: string; place: string };
  search: QuerySearch;
}

export function localityTarget(place: Place, search: QuerySearch): LocalityTarget {
  return {
    params: { country: (place.country_code || "gb").toLowerCase(), place: place.slug },
    search: parseQuerySearch({ ...search }),
  };
}

export type FrontDoorPlan =
  | { kind: "locality"; target: LocalityTarget; place: Place }
  | { kind: "ambiguous"; choices: { place: Place; target: LocalityTarget }[] }
  | { kind: "none" };

/** Decide where free text goes. Never guesses between same-named places. */
export function planFrontDoor(index: PlaceIndex | null, text: string): FrontDoorPlan {
  if (!index || !text.trim()) return { kind: "none" };
  const split = splitPlaceFromQuery(index, text);
  const search: QuerySearch = { q: split.rest, from: text };
  if (split.place) {
    return { kind: "locality", place: split.place, target: localityTarget(split.place, search) };
  }
  if (split.candidates.length > 1) {
    return {
      kind: "ambiguous",
      choices: split.candidates.map((place) => ({ place, target: localityTarget(place, search) })),
    };
  }
  return { kind: "none" };
}

/**
 * Plain text filter: every word of the query must appear in the entry's own
 * title, summary, details or host. No synonyms, no scoring, order unchanged.
 */
export function filterEntriesByText(entries: WorldEntry[], q: string | undefined): WorldEntry[] {
  const words = (q ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);
  if (!words.length) return [];
  return entries.filter((entry) => {
    const hay = [entry.title, entry.summary, entry.host, ...(entry.details ?? [])]
      .join(" ")
      .toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
