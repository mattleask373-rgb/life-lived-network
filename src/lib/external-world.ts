/**
 * Provider-neutral boundary between external-world sources and Living World.
 *
 * Providers (Ticketmaster, future event/job sources, etc.) must normalize into
 * these facts before anything reaches canonical discovery or presentation.
 * This layer does not match, rank, invent, or publish content.
 */

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
 * Normalize an event without inventing missing facts.
 *
 * Returns null when the provider record lacks the minimum identity needed for
 * a trustworthy canonical candidate.
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
 * An external event can only be considered for current discovery when it has
 * explicit locality and timing and is not known to be expired/cancelled.
 * This is a gate, not a ranking algorithm.
 */
export function isDiscoverableExternalEvent(event: ExternalEvent): boolean {
  return Boolean(
    event.localityId &&
      event.startsAt &&
      event.freshness === "current" &&
      !event.cancellation,
  );
}
