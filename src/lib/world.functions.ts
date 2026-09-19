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

    // The hierarchy is expanded here, not in the browser. A nation can contain
    // thousands of localities, and naming them all in the request would make
    // the request itself the bottleneck; the browser only says where it is.
    let insideIds = context.placeIds ?? [];
    let insideSlugs = context.placeSlugs ?? [];
    if (context.placeId && !insideIds.length) {
      const { loadPlaceIndex } = await import("./place-index.server");
      const { descendantIdsOf } = await import("./places");
      const index = await loadPlaceIndex(supabase);
      insideIds = descendantIdsOf(index, context.placeId);
      insideSlugs = insideIds
        .map((id) => index.byId.get(id)?.slug)
        .filter((slug): slug is string => Boolean(slug));
    }

    let query = supabase
      .from("listings")
      .select("*")
      .eq("status", "published")
      .neq("data_quality", "expired")
      // Something cancelled or postponed is not something to go to. The record
      // and its provenance stay; it simply stops being an answer.
      .eq("cancellation", "")
      // Things with a real start time come first, soonest first; everything
      // else keeps its existing most-recent-first order.
      .order("starts_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    // A locality, or a locality and everywhere inside it. Either way the read
    // stays bounded by the same page limit.
    //
    // A very wide selection — a nation, or the whole world region — can name
    // more localities than it is sensible to put in one filter. Rather than
    // quietly filtering by an arbitrary slice of them, which would hide real
    // activity, the locality filter is dropped: at that width it excludes
    // almost nothing anyway, and the page limit still bounds the read.
    const LOCALITY_FILTER_CAP = 400;
    if (insideIds.length && insideIds.length <= LOCALITY_FILTER_CAP) {
      query = query.in("place_id", insideIds);
    } else if (!insideIds.length && context.placeId) {
      query = query.eq("place_id", context.placeId);
    }

    // An event that has finished is never upcoming. Anything without a start
    // time is unaffected by time filtering.
    const settled = new Date(Date.now() - 3 * 3600000).toISOString();
    query = query.or(`starts_at.is.null,starts_at.gte.${context.startTime ?? settled}`);
    if (context.endTime) query = query.or(`starts_at.is.null,starts_at.lte.${context.endTime}`);

    const { data: rows, error } = await query;
    if (error) throw error;

    const listings = (rows ?? []) as unknown as ListingRow[];
    // One extra query for all creators, never one per listing.
    const names = new Map<string, string>();
    const creatorIds = [
      ...new Set(listings.map((r) => r.creator_id).filter((id): id is string => Boolean(id))),
    ];
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

    // Where source-derived activity came from: one query for the page, never
    // one per card, and only the fields needed to credit and link back.
    const provenance = new Map<string, { sourceName: string; sourceUrl: string }>();
    const imported = listings.filter((r) => r.origin === "source" || r.origin === "confirmed");
    if (imported.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: records } = await supabaseAdmin
        .from("source_records")
        .select("listing_id, source_id, source_url")
        .in(
          "listing_id",
          imported.map((r) => r.id),
        );
      const sourceIds = [...new Set((records ?? []).map((r) => r.source_id))];
      const sourceNames = new Map<string, string>();
      if (sourceIds.length) {
        const { data: sources } = await supabaseAdmin
          .from("sources")
          .select("id, name, attribution")
          .in("id", sourceIds);
        for (const source of sources ?? []) {
          sourceNames.set(source.id, source.attribution || source.name);
        }
      }
      for (const record of records ?? []) {
        if (!record.listing_id) continue;
        provenance.set(record.listing_id, {
          sourceName: sourceNames.get(record.source_id) ?? "An outside source",
          sourceUrl: record.source_url ?? "",
        });
      }
    }

    const page = toPage(
      listings.map((r) =>
        rowToEntry(
          r,
          r.creator_id ? names.get(r.creator_id) : undefined,
          photos.get(r.id) ?? [],
          provenance.get(r.id),
        ),
      ),
      offset,
      limit,
    );

    // The trial layer, only on the first page, only for the locality being
    // looked at, and only ever labelled as a demonstration. A locality with no
    // trial records stays quiet rather than borrowing someone else's.
    if (offset === 0) {
      const slugs = new Set(insideSlugs);
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
