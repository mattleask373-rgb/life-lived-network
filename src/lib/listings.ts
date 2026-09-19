/**
 * The real half of the world.
 *
 * Demo entries live in world-data.ts. Everything a real person posts lives in
 * the `listings` table and is mapped into the very same `WorldEntry` shape, so
 * the map, the sheets and the journey engine don't care where a thing came from.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  ENTRIES,
  type DataQuality,
  type LayerId,
  type TimeBand,
  type WorldEntry,
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
  { id: "work", label: "Offer work", blurb: "Paid hours someone could take tomorrow", layer: "work" },
  { id: "experience", label: "Host an experience", blurb: "Something you know how to do", layer: "experience" },
  { id: "event", label: "Create an event", blurb: "Music, a talk, a gathering", layer: "music" },
  { id: "project", label: "Share a project", blurb: "Something being built that needs help", layer: "community" },
  { id: "skill", label: "Offer a skill", blurb: "An hour of what you're good at", layer: "art" },
  { id: "community", label: "Offer a community activity", blurb: "Hands needed, locally", layer: "community" },
  { id: "recommendation", label: "Share a local recommendation", blurb: "Somewhere your friends actually go", layer: "food" },
  { id: "table", label: "Open a table", blurb: "You're eating, and there's room", layer: "food" },
  { id: "collaboration", label: "Look for collaborators", blurb: "You need a third pair of hands", layer: "art" },
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

export function rowToEntry(row: ListingRow, hostName?: string): WorldEntry {
  const quality = row.data_quality as DataQuality;
  return {
    id: row.id,
    layer: asLayer(row.layer),
    title: row.title,
    place: row.place || "Shared once you say you're coming",
    neighbourhood: row.neighbourhood || "Nearby",
    x: Number(row.x),
    y: Number(row.y),
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
  };
}

/** Everything real people have posted, newest first. */
export async function fetchCommunityEntries(): Promise<WorldEntry[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "published")
    .neq("data_quality", "expired")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  const rows = (data ?? []) as unknown as ListingRow[];
  const creatorIds = [...new Set(rows.map((r) => r.creator_id))];
  const names = new Map<string, string>();
  if (creatorIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", creatorIds);
    for (const p of profiles ?? []) {
      if (p.display_name) names.set(p.id, p.display_name);
    }
  }
  return rows.map((r) => rowToEntry(r, names.get(r.creator_id)));
}

/**
 * The whole world. Read through the server now, so paging, indexes and later
 * caching live in one place. Falls back to the demo place if the server read
 * fails, rather than showing an empty world.
 */
export async function fetchWorld(): Promise<WorldEntry[]> {
  try {
    const { getWorld } = await import("./world.functions");
    return await getWorld({ data: {} });
  } catch {
    try {
      const community = await fetchCommunityEntries();
      return [...community, ...ENTRIES];
    } catch {
      return ENTRIES;
    }
  }
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
