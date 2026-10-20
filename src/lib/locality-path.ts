/**
 * The canonical address of a locality page, in one place.
 *
 * Route files export route components; a helper exported from a route file
 * breaks fast refresh, so this lives here instead.
 */

import type { PlaceBrief } from "./locality.functions";

export function localityPath(place: Pick<PlaceBrief, "slug" | "countrySegment">): string {
  return `/${place.countrySegment || "gb"}/${place.slug}`;
}
