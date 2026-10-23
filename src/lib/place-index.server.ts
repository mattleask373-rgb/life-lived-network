/**
 * Canonical geography, loaded behind the server boundary.
 * A partial index is never accepted as a complete hierarchy.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  PLACE_SCAN_LIMIT,
  PLACE_SCAN_PAGE_SIZE,
  assertCompletePlaceScan,
  readBoundedPlacePages,
} from "./bounded-place-scan";
import { buildPlaceIndex, type Place, type PlaceIndex } from "./places";

const SELECT = "id, parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb";

export async function loadPlaceIndex(client: SupabaseClient<Database>): Promise<PlaceIndex> {
  // Exact count guards against a proxy/PostgREST row cap silently truncating a short page.
  const { count: expectedCount, error: countError } = await client
    .from("places")
    .select("id", { count: "exact", head: true });
  if (countError) throw countError;

  const places = await readBoundedPlacePages(
    PLACE_SCAN_LIMIT,
    PLACE_SCAN_PAGE_SIZE,
    async (afterId, limit) => {
      let query = client
        .from("places")
        .select(SELECT)
        .order("id", { ascending: true })
        .limit(limit);
      if (afterId !== null) query = query.gt("id", afterId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Place[];
    },
  );
  return buildPlaceIndex(assertCompletePlaceScan(places, expectedCount));
}
