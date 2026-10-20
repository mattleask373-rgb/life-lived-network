/**
 * Pure service + locality page evidence. This module never fetches records,
 * ranks providers, invents availability, or changes the canonical supply engine.
 */
import { categoryBySlug, inCategory } from "./service-taxonomy";
import { evaluateIndexability, type IndexabilityDecision } from "./seo-indexability";
import { hasPublicWorkOpportunity } from "./work-opportunity-presentation";
import { isService } from "./services";
import type { PlaceBrief } from "./locality.functions";
import type { WorldEntry } from "./world-data";

export type ServiceLocalityPlace = Pick<
  PlaceBrief,
  "id" | "name" | "slug" | "countrySegment" | "blurb"
>;

export function serviceLocalityPath(
  place: Pick<ServiceLocalityPlace, "slug" | "countrySegment">,
  serviceSlug: string,
): string {
  return `/${place.countrySegment.toLowerCase()}/${place.slug}/${serviceSlug}`;
}

/** Matching records retain their existing category evidence and source facts. */
export function categoryServiceEntries(entries: WorldEntry[], serviceSlug: string): WorldEntry[] {
  if (!categoryBySlug(serviceSlug)) return [];
  return entries
    .filter(
      (entry) =>
        (isService(entry) || hasPublicWorkOpportunity(entry)) &&
        inCategory(entry, serviceSlug) &&
        entry.quality !== "expired" &&
        !entry.cancellation,
    )
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Only real, current records are presented as available services on this route. */
export function publicServiceEntries(entries: WorldEntry[], serviceSlug: string): WorldEntry[] {
  return categoryServiceEntries(entries, serviceSlug).filter((entry) => !entry.demonstration);
}

function recordIsFresh(entry: WorldEntry, now: number): boolean {
  if (
    entry.quality === "expired" ||
    entry.quality === "may have changed" ||
    Boolean(entry.cancellation)
  ) {
    return false;
  }

  const startsAt = entry.startsAt ? Date.parse(entry.startsAt) : undefined;
  const endsAt = entry.endsAt ? Date.parse(entry.endsAt) : undefined;
  if (startsAt !== undefined && !Number.isFinite(startsAt)) return false;
  if (endsAt !== undefined && !Number.isFinite(endsAt)) return false;
  const expiry = endsAt ?? startsAt;
  return expiry === undefined || expiry >= now;
}

function recordHasProvenance(entry: WorldEntry): boolean {
  if (entry.origin === "resident") return true;
  return (
    (entry.origin === "source" || entry.origin === "confirmed") &&
    Boolean(entry.sourceName?.trim() && entry.sourceUrl?.trim())
  );
}

/**
 * One shared SEO decision for both head metadata and any future sitemap builder.
 * Caller-provided records must already be the canonical public read; demo rows
 * are explicitly excluded from the genuine-record count.
 */
export function evaluateServiceLocalityPage(input: {
  place: ServiceLocalityPlace;
  serviceSlug: string;
  entries: WorldEntry[];
  now?: number;
}): IndexabilityDecision {
  const category = categoryBySlug(input.serviceSlug);
  const matching = categoryServiceEntries(input.entries, input.serviceSlug);
  const genuine = matching.filter((entry) => !entry.demonstration);
  const now = input.now ?? Date.now();

  return evaluateIndexability({
    pageKind: "service",
    published: true,
    placeValid:
      Boolean(input.place.id.trim()) &&
      /^[a-z]{2}$/.test(input.place.countrySegment) &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.place.slug),
    categoryValid: Boolean(category),
    publishedRecordCount: genuine.length,
    demonstrationOnly: matching.length > 0 && genuine.length === 0,
    informationComplete: Boolean(input.place.name.trim() && input.place.blurb.trim() && category),
    recordsFresh: genuine.every((entry) => recordIsFresh(entry, now)),
    provenancePresent: genuine.every(recordHasProvenance),
    // Useful page-locality, map, and existing activity links are rendered by the route.
    internalLinksPresent: true,
    // Fetches use the existing public read boundary. Do not bypass it here.
    policyAllowed: true,
  });
}
