/**
 * Provider-neutral boundary between external-world sources and Living World.
 *
 * Providers (Ticketmaster, future event/job sources, etc.) must normalize into
 * these facts before anything reaches canonical discovery or presentation.
 * This layer does not match, rank, invent, or publish content.
 *
 * It is completely provider-neutral: no Ticketmaster or provider-specific
 * schema leaks into downstream UI or canonical discovery.
 */

import type { Place, PlaceIndex } from "./places";

export type ExternalEntityKind = "event" | "job" | "place" | "service" | "experience";

export type ExternalProviderKind = "events" | "jobs" | "places" | "services" | "experiences";

export type ExternalFreshness = "current" | "stale" | "expired" | "unknown";

export interface ExternalProvenance {
  provider: string;
  providerEntityId: string;
  sourceUrl?: string;
  observedAt: string;
}

export interface ExternalEvent {
  id: string;
  kind: "event";
  title: string;
  localityId: string | null;
  localityName: string | null;
  venueName: string | null;
  neighbourhood: string | null;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string | null;
  description: string | null;
  organiser: string | null;
  ticketUrl: string | null;
  sourceUrl: string | null;
  cancellation: "cancelled" | "postponed" | null;
  freshness: ExternalFreshness;
  provenance: ExternalProvenance;
}

export interface ProviderDescriptor {
  id: string;
  label: string;
  kind: ExternalProviderKind;
  capabilities: readonly string[];
  requiresCredentials: boolean;
  supportsDeepLinks: boolean;
}

export const TICKETMASTER_PROVIDER: ProviderDescriptor = {
  id: "ticketmaster",
  label: "Ticketmaster",
  kind: "events",
  capabilities: ["events", "venues", "artists", "dates", "ticket_links"],
  requiresCredentials: true,
  supportsDeepLinks: true,
};

/**
 * Normalize an external event into provider-neutral facts without inventing
 * missing values.
 *
 * Returns null when the record lacks minimum identity (provider entity ID or title).
 */
export function normalizeExternalEvent(input: {
  provider: string;
  providerEntityId?: string | null;
  title?: string | null;
  localityId?: string | null;
  localityName?: string | null;
  venueName?: string | null;
  neighbourhood?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;
  description?: string | null;
  organiser?: string | null;
  ticketUrl?: string | null;
  sourceUrl?: string | null;
  cancellation?: "cancelled" | "postponed" | null;
  observedAt: string;
  freshness: ExternalFreshness;
}): ExternalEvent | null {
  const id = input.providerEntityId?.trim();
  const title = input.title?.trim();

  if (!id || !title) return null;

  return {
    id: `${input.provider}:${id}`,
    kind: "event",
    title,
    localityId: input.localityId ?? null,
    localityName: input.localityName ?? null,
    venueName: input.venueName ?? null,
    neighbourhood: input.neighbourhood ?? null,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    timezone: input.timezone ?? null,
    description: input.description ?? null,
    organiser: input.organiser ?? null,
    ticketUrl: input.ticketUrl ?? null,
    sourceUrl: input.sourceUrl ?? null,
    cancellation: input.cancellation ?? null,
    freshness: input.freshness,
    provenance: {
      provider: input.provider,
      providerEntityId: id,
      sourceUrl: input.sourceUrl ?? undefined,
      observedAt: input.observedAt,
    },
  };
}

/**
 * Determine external event freshness strictly from observable time and state.
 *
 * Never guesses:
 * - Expired if end time (or start time) is in the past.
 * - Stale if observed time is older than maximum freshness window (e.g. 7 days).
 * - Current if future and observed within window.
 * - Unknown if timestamps are invalid or unparseable.
 */
export function evaluateEventFreshness(input: {
  startsAt: string | null;
  endsAt?: string | null;
  observedAt: string;
  now?: Date;
  staleAfterHours?: number;
}): ExternalFreshness {
  const now = input.now ?? new Date();
  const staleThreshold = (input.staleAfterHours ?? 168) * 3600000; // default 7 days

  if (!input.startsAt) return "unknown";
  const startMs = new Date(input.startsAt).getTime();
  if (!Number.isFinite(startMs)) return "unknown";

  const finishMs = input.endsAt ? new Date(input.endsAt).getTime() : startMs;
  if (Number.isFinite(finishMs) && finishMs < now.getTime()) {
    return "expired";
  }

  const observedMs = new Date(input.observedAt).getTime();
  if (!Number.isFinite(observedMs)) return "unknown";

  const ageMs = now.getTime() - observedMs;
  if (ageMs > staleThreshold) {
    return "stale";
  }

  return "current";
}

/**
 * Deterministically resolve locality from external city name and country code
 * against the authoritative PlaceIndex.
 *
 * Never equates artist or venue with locality.
 * Returns null if no confident match exists.
 */
export function resolveEventLocality(
  cityName: string | null | undefined,
  countryCode: string | null | undefined,
  placeIndex: PlaceIndex,
): Place | null {
  if (!cityName || !cityName.trim()) return null;
  const normalizedCity = cityName.trim().toLowerCase();
  const normalizedCountry = countryCode?.trim().toUpperCase();

  // Search exact name match within country if country is provided
  for (const place of placeIndex.places) {
    const nameMatch = place.name.toLowerCase() === normalizedCity;
    const countryMatch =
      !normalizedCountry || place.country_code.toUpperCase() === normalizedCountry;
    if (nameMatch && countryMatch) {
      return place;
    }
  }

  // Fallback to name match regardless of country if only one candidate exists
  const candidates = placeIndex.places.filter((p) => p.name.toLowerCase() === normalizedCity);
  if (candidates.length === 1) {
    return candidates[0]!;
  }

  return null;
}

/**
 * Gate for whether an external event is currently actionable and discoverable.
 *
 * Requires:
 * - Resolved locality
 * - Valid future start time
 * - Fresh (current)
 * - Not cancelled or postponed
 */
export function isDiscoverableExternalEvent(event: ExternalEvent): boolean {
  return Boolean(
    event.localityId && event.startsAt && event.freshness === "current" && !event.cancellation,
  );
}

/**
 * Deterministic deduplication check.
 *
 * Two events are the same if and only if they share provider and providerEntityId.
 * Distinct events from the same or different sources remain distinct.
 */
export function isSameExternalEvent(a: ExternalEvent, b: ExternalEvent): boolean {
  return (
    a.provenance.provider === b.provenance.provider &&
    a.provenance.providerEntityId === b.provenance.providerEntityId
  );
}
