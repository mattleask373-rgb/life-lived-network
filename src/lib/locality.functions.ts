/**
 * A locality, resolved behind the server boundary.
 *
 * A public locality page needs its geography before it can render anything a
 * search engine could read: the place itself, the chain it sits inside, and the
 * places inside it. Geography is public and slow-changing, so this is a cheap,
 * bounded read of the same `places` hierarchy every other screen uses. No
 * locality is named in code.
 */

import { createServerFn } from "@tanstack/react-start";

import { asDataError } from "./data/errors";
import type { PlaceKind } from "./places";

/** Just enough of a place to render and link to it. */
export interface PlaceBrief {
  id: string;
  name: string;
  slug: string;
  kind: PlaceKind;
  /** Lower-case country code, used as the first URL segment. */
  countrySegment: string;
  blurb: string;
  lat: number | null;
  lng: number | null;
}

export interface LocalityGeography {
  place: PlaceBrief;
  /** Nearest parent first, up to the widest place we know. */
  ancestors: PlaceBrief[];
  /** Places directly inside, bounded — a nation has a great many. */
  children: PlaceBrief[];
  /** Places alongside it inside the same parent, bounded. */
  siblings: PlaceBrief[];
}

export const getLocality = createServerFn({ method: "GET" })
  .inputValidator((input: { slug?: string } | undefined) => ({
    slug: String(input?.slug ?? "")
      .trim()
      .toLowerCase(),
  }))
  .handler(async ({ data }): Promise<LocalityGeography | null> => {
    if (!data.slug) return null;
    try {
      const { publicServerClient } = await import("./supabase-public.server");
      const { loadPlaceIndex } = await import("./place-index.server");
      const { ancestorsOf, childrenOf } = await import("./places");
      const index = await loadPlaceIndex(publicServerClient());

      const place = index.bySlug.get(data.slug);
      if (!place) return null;

      const brief = (p: typeof place): PlaceBrief => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        kind: p.kind,
        countrySegment: (p.country_code || "").toLowerCase(),
        blurb: p.blurb ?? "",
        lat: p.lat,
        lng: p.lng,
      });

      const ancestors = ancestorsOf(index, place.id);
      const parent = ancestors[0];
      return {
        place: brief(place),
        ancestors: ancestors.map(brief),
        children: childrenOf(index, place.id).slice(0, 36).map(brief),
        siblings: parent
          ? childrenOf(index, parent.id)
              .filter((p) => p.id !== place.id)
              .slice(0, 12)
              .map(brief)
          : [],
      };
    } catch (error) {
      throw asDataError(error);
    }
  });
