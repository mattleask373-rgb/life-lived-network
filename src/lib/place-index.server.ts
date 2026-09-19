/**
 * The geography, loaded once per request behind the server.
 *
 * Places are public, small and slow-changing, so the hierarchy is walked in
 * memory. Activity is never loaded this way — that stays bounded and filtered.
 */

import { buildPlaceIndex, type Place, type PlaceIndex } from "./places";

const SELECT = "id, parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb";

export async function loadPlaceIndex(client: {
  from: (table: "places") => {
    select: (columns: string) => {
      limit: (count: number) => PromiseLike<{ data: unknown[] | null }>;
    };
  };
}): Promise<PlaceIndex> {
  const { data } = await client.from("places").select(SELECT).limit(5000);
  return buildPlaceIndex((data ?? []) as unknown as Place[]);
}
