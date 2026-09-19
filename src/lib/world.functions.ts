/**
 * Public world reads, behind the server.
 *
 * The browser no longer queries the database for the shared world; it asks the
 * server, which pages and filters by place. WorldEntry and rowToEntry() remain
 * the boundary — nothing database-shaped travels further than this file.
 */

import { createServerFn } from "@tanstack/react-start";

import { rowToEntry, type ListingRow } from "./listings";
import { ENTRIES, type WorldEntry } from "./world-data";

export interface WorldQuery {
  placeId?: string | null;
  limit?: number;
  offset?: number;
}

export const getWorld = createServerFn({ method: "GET" })
  .inputValidator((input: WorldQuery | undefined) => input ?? {})
  .handler(async ({ data }): Promise<WorldEntry[]> => {
    const { publicServerClient } = await import("./supabase-public.server");
    const supabase = publicServerClient();
    const limit = Math.min(data.limit ?? 100, 200);
    const offset = data.offset ?? 0;

    let query = supabase
      .from("listings")
      .select("*")
      .eq("status", "published")
      .neq("data_quality", "expired")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (data.placeId) query = query.eq("place_id", data.placeId);

    const { data: rows, error } = await query;
    if (error) throw error;

    const listings = (rows ?? []) as unknown as ListingRow[];
    const names = new Map<string, string>();
    const creatorIds = [...new Set(listings.map((r) => r.creator_id))];
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

    const community = listings.map((r) => rowToEntry(r, names.get(r.creator_id)));
    // The demonstration place stays until a locality has real density of its own.
    return offset === 0 ? [...community, ...ENTRIES] : community;
  });
