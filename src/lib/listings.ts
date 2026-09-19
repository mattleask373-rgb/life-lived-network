/**
 * The real half of the world.
 *
 * Everything a real person posts lives in the `listings` table and is mapped
 * into the `WorldEntry` domain shape by rowToEntry() — the one normalisation
 * seam. Demo entries are fixtures (`fixtures/world-entries.ts`) and only the
 * server decides whether they belong in an answer.
 */

import { supabase } from "@/integrations/supabase/client";
import type { DiscoveryContext, Page } from "./data/contract";
import {
  type DataQuality,
  type LayerId,
  type TimeBand,
  type WorldEntry,
  type SourcePhoto,
} from "./world-data";

export interface ListingRow {
  id: string;
  creator_id: string;
  kind: string;
  layer: string;
  title: string;
  summary: string;
  details: string[];
  place: string;
  neighbourhood: string;
  x: number;
  y: number;
  place_id: string | null;
  lat: number | null;
  lng: number | null;
  when_text: string;
  band: string;
  minutes: number;
  cost: number;
  currency: string;
  give: string | null;
  social: string;
  outdoors: boolean;
  skills: string[];
  people_needed: number | null;
  contact_note: string | null;
  accessibility: string | null;
  status: string;
  data_quality: string;
}

/** What someone can make happen. Each maps onto one map layer by default. */
export const KINDS: {
  id: string;
  label: string;
  blurb: string;
  layer: LayerId;
}[] = [
  {
    id: "work",
    label: "Offer work",
    blurb: "Paid hours someone could take tomorrow",
    layer: "work",
  },
  {
    id: "experience",
    label: "Host an experience",
    blurb: "Something you know how to do",
    layer: "experience",
  },
  { id: "event", label: "Create an event", blurb: "Music, a talk, a gathering", layer: "music" },
  {
    id: "project",
    label: "Share a project",
    blurb: "Something being built that needs help",
    layer: "community",
  },
  { id: "skill", label: "Offer a skill", blurb: "An hour of what you're good at", layer: "art" },
  {
    id: "community",
    label: "Offer a community activity",
    blurb: "Hands needed, locally",
    layer: "community",
  },
  {
    id: "recommendation",
    label: "Share a local recommendation",
    blurb: "Somewhere your friends actually go",
    layer: "food",
  },
  { id: "table", label: "Open a table", blurb: "You're eating, and there's room", layer: "food" },
  {
    id: "collaboration",
    label: "Look for collaborators",
    blurb: "You need a third pair of hands",
    layer: "art",
  },
];

const LAYER_IDS: LayerId[] = [
  "work",
  "experience",
  "music",
  "art",
  "community",
  "people",
  "nature",
  "food",
];
const BANDS: TimeBand[] = ["now", "today", "tonight", "tomorrow", "weekend"];

function asLayer(v: string): LayerId {
  return (LAYER_IDS as string[]).includes(v) ? (v as LayerId) : "experience";
}
function asBand(v: string): TimeBand {
  return (BANDS as string[]).includes(v) ? (v as TimeBand) : "today";
}
function asSocial(v: string): WorldEntry["social"] {
  return v === "quiet" || v === "lively" ? v : "friendly";
}

export function rowToEntry(
  row: ListingRow,
  hostName?: string,
  photos: SourcePhoto[] = [],
): WorldEntry {
  const quality = row.data_quality as DataQuality;
  return {
    id: row.id,
    placeId: row.place_id,
    layer: asLayer(row.layer),
    title: row.title,
    place: row.place || "Shared once you say you're coming",
    neighbourhood: row.neighbourhood || "Nearby",
    x: Number(row.x),
    y: Number(row.y),
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
    currency: row.currency || "GBP",
    when: row.when_text,
    band: asBand(row.band),
    minutes: row.minutes,
    cost: Number(row.cost),
    summary: row.summary,
    details: [
      ...row.details,
      ...(row.people_needed ? [`Room for ${row.people_needed} people`] : []),
      ...(row.accessibility ? [row.accessibility] : []),
      ...(row.contact_note ? [row.contact_note] : []),
    ],
    ...(row.give ? { give: row.give } : {}),
    host: hostName ? `${hostName}, posted this themselves` : "Posted by someone here",
    verified: quality === "verified",
    social: asSocial(row.social),
    outdoors: row.outdoors,
    community: true,
    quality,
    kind: row.kind,
    skills: row.skills,
    ...(photos.length ? { photos: photos.slice(0, 6) } : {}),
  };
}

/**
 * The world for a given context, through the server boundary.
 *
 * The caller says where and how much; paging, limits, batching, fixtures policy
 * and future providers all live below this line.
 */
export async function fetchWorld(context: DiscoveryContext = {}): Promise<Page<WorldEntry>> {
  const { getWorld } = await import("./world.functions");
  return getWorld({ data: context });
}

/** Convenience for screens that just want the current page of entries. */
export async function fetchWorldEntries(context: DiscoveryContext = {}): Promise<WorldEntry[]> {
  return (await fetchWorld(context)).items;
}

export interface NewListing {
  kind: string;
  layer: LayerId;
  title: string;
  summary: string;
  details: string[];
  place: string;
  neighbourhood: string;
  when_text: string;
  band: TimeBand;
  minutes: number;
  cost: number;
  give: string | null;
  social: WorldEntry["social"];
  outdoors: boolean;
  people_needed: number | null;
  accessibility: string | null;
  contact_note: string | null;
  x: number;
  y: number;
  /** Which real place this belongs to. */
  place_id: string | null;
  /** Approximate, place-level coordinates — never an address. */
  lat: number | null;
  lng: number | null;
}

export async function createListing(input: NewListing, creatorId: string) {
  const { data, error } = await supabase
    .from("listings")
    .insert({ ...input, creator_id: creatorId })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}
