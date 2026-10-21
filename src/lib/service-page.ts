/**
 * The service-in-a-place page, as pure decisions.
 *
 * `/<country>/<place>/<service>` — "Gardening in Kings Heath". Everything the
 * route renders is decided here so the page itself stays a thin shell and the
 * rules stay testable:
 *
 *   LISTINGS      which records genuinely belong on the page. The same rules
 *                 the locality page's "kinds of service" section uses: current,
 *                 genuinely a service, and in the category by the record's own
 *                 words or its owner's declaration. Demonstration records are
 *                 separated out, never counted as supply.
 *   INDEXABILITY  the route uses service-locality-indexability.ts to apply the
 *                 same evidence gate as dynamic sitemap enumeration. A page
 *                 with no qualifying real listing stays out of search indexes.
 *
 * Nothing here writes copy about a place or a provider that the records do
 * not already contain.
 */

import { categoryBySlug, inCategory, type ServiceCategory } from "./service-taxonomy";
import { isService } from "./services";
import type { WorldEntry } from "./world-data";

export interface ServicePageListings {
  category: ServiceCategory;
  /** Genuine, current records in the category. */
  real: WorldEntry[];
  /** Clearly-labelled trial records — shown as such, never counted. */
  demonstration: WorldEntry[];
}

/**
 * The records a service page may show, or null when the slug is not a known
 * service category (the route answers 404). Mirrors categoriesPresent(): a
 * record must be current and genuinely a service, and the category must come
 * from the record's own evidence.
 */
export function servicePageListings(
  entries: WorldEntry[],
  slug: string,
): ServicePageListings | null {
  const category = categoryBySlug(slug);
  if (!category) return null;
  const inScope = entries.filter(
    (entry) =>
      entry.quality !== "expired" &&
      !entry.cancellation &&
      isService(entry) &&
      inCategory(entry, category.slug),
  );
  return {
    category,
    real: inScope.filter((entry) => !entry.demonstration),
    demonstration: inScope.filter((entry) => entry.demonstration === true),
  };
}

/**
 * Whether the page is genuinely useful enough to be listed by a search
 * engine. One real, current listing is enough — a specific service page with
 * a real provider is a useful answer. Trial data alone is not.
 */
export function servicePageIndexable(listings: ServicePageListings): boolean {
  return listings.real.length >= 1;
}

/** The canonical path for a service page. */
export function servicePagePath(
  place: { slug: string; countrySegment: string },
  category: Pick<ServiceCategory, "slug">,
): string {
  return `/${place.countrySegment || "gb"}/${place.slug}/${category.slug}`;
}

export interface ServicePageCopy {
  title: string;
  description: string;
}

/**
 * The page's title and description, built only from what is true: the place,
 * the category, and how many genuine records exist. A quiet page describes
 * itself as quiet rather than implying supply.
 */
export function servicePageCopy(placeName: string, listings: ServicePageListings): ServicePageCopy {
  const { category, real } = listings;
  const title = `${category.label} in ${placeName} | Real World Atlas`;
  const description = real.length
    ? `${category.plural} in ${placeName}: ${real.length === 1 ? "one genuine listing" : `${real.length} genuine listings`} recorded by people there, with what each one actually says about itself.`
    : `${category.label} in ${placeName}. Nobody has offered this here yet — the page says so honestly and shows how to be the first.`;
  return { title, description };
}
