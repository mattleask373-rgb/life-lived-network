/**
 * The world, behind the server boundary.
 *
 * The browser never queries the shared world directly any more: it hands over a
 * DiscoveryContext and gets back a page of domain entities. rowToEntry() stays
 * the single normalisation seam, so database shapes never travel upwards, and a
 * future provider adapter can feed the same page without a caller changing.
 */

import { createServerFn } from "@tanstack/react-start";

import { decodeCursor, pageLimit, toPage, type DiscoveryContext, type Page } from "./data/contract";
import { asDataError } from "./data/errors";
import { rowToEntry, type ListingRow } from "./listings";
import type { SourcePhoto, WorldEntry } from "./world-data";

export const getWorld = createServerFn({ method: "GET" })
  .inputValidator((input: DiscoveryContext | undefined) => input ?? {})
  .handler(async ({ data }): Promise<Page<WorldEntry>> => {
    const { observe } = await import("./data/observe.server");
    return observe(
      "world.page",
      () => readWorld(data),
      (page) => page.items.length,
    );
  });

async function readWorld(context: DiscoveryContext): Promise<Page<WorldEntry>> {
  const limit = pageLimit(context.limit);
  const offset = decodeCursor(context.cursor);

  try {
    const { publicServerClient } = await import("./supabase-public.server");
    const { fixturesAllowed } = await import("./data/fixtures-policy.server");
    const supabase = publicServerClient();

    let query = supabase
      .from("listings")
      .select("*")
      .eq("status", "published")
      .neq("data_quality", "expired")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    // A locality, or a locality and everywhere inside it. Either way the read
    // stays bounded by the same page limit.
    const localities = (context.placeIds ?? []).slice(0, 400);
    if (localities.length) query = query.in("place_id", localities);
    else if (context.placeId) query = query.eq("place_id", context.placeId);

    const { data: rows, error } = await query;
    if (error) throw error;

    const listings = (rows ?? []) as unknown as ListingRow[];
    // One extra query for all creators, never one per listing.
    const names = new Map<string, string>();
    const creatorIds = [...new Set(listings.map((r) => r.creator_id))];
    const photos = new Map<string, SourcePhoto[]>();
    if (creatorIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", creatorIds)
        .eq("discoverable", true);
      for (const p of profiles ?? []) {
        if (p.display_name) names.set(p.id, p.display_name);
      }
    }

    if (listings.length) {
      const { data: photoRows, error: photoError } = await supabase
        .from("listing_photos")
        .select("listing_id, image_url, source_url, credit, alt_text, position")
        .in(
          "listing_id",
          listings.map((listing) => listing.id),
        )
        .order("position", { ascending: true });
      if (photoError) throw photoError;
      for (const photo of photoRows ?? []) {
        const current = photos.get(photo.listing_id) ?? [];
        current.push({
          url: photo.image_url,
          sourceUrl: photo.source_url,
          credit: photo.credit,
          alt: photo.alt_text,
        });
        photos.set(photo.listing_id, current);
      }
    }

    const page = toPage(
      listings.map((r) => rowToEntry(r, names.get(r.creator_id), photos.get(r.id) ?? [])),
      offset,
      limit,
    );

    // The trial layer, only on the first page, only for the locality being
    // looked at, and only ever labelled as a demonstration. A locality with no
    // trial records stays quiet rather than borrowing someone else's.
    if (offset === 0) {
      const slugs = new Set(context.placeSlugs ?? []);
      if (slugs.size || fixturesAllowed()) {
        const { DEMO_ENTRIES } = await import("./fixtures/world-entries");
        const matching = slugs.size
          ? DEMO_ENTRIES.filter((entry) => slugs.has(entry.placeSlug))
          : DEMO_ENTRIES;
        if (matching.length) return { ...page, items: [...page.items, ...matching] };
      }
    }
    return page;
  } catch (error) {
    throw asDataError(error);
  }
}
