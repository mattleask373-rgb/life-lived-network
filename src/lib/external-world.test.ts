import { describe, expect, it } from "vitest";
import {
  TICKETMASTER_PROVIDER,
  isDiscoverableExternalEvent,
  normalizeExternalEvent,
} from "./external-world";

describe("external-world provider boundary", () => {
  const base = {
    provider: "ticketmaster",
    providerEntityId: "123",
    title: "Local Rap Night",
    localityId: "birmingham",
    localityName: "Birmingham",
    venueName: "Hare & Hounds",
    startsAt: "2026-11-14T19:00:00+00:00",
    endsAt: "2026-11-14T23:00:00+00:00",
    timezone: "Europe/London",
    ticketUrl: "https://tickets.example.test/event/123",
    sourceUrl: "https://source.example.test/event/123",
    observedAt: "2026-10-06T16:00:00Z",
    freshness: "current" as const,
  };

  it("describes Ticketmaster as a provider, not as a UI contract", () => {
    expect(TICKETMASTER_PROVIDER.kind).toBe("events");
    expect(TICKETMASTER_PROVIDER.requiresCredentials).toBe(true);
    expect(TICKETMASTER_PROVIDER.supportsDeepLinks).toBe(true);
  });

  it("normalizes explicit event facts and preserves provenance", () => {
    const event = normalizeExternalEvent(base);
    expect(event).not.toBeNull();
    expect(event?.id).toBe("ticketmaster:123");
    expect(event?.localityId).toBe("birmingham");
    expect(event?.venueName).toBe("Hare & Hounds");
    expect(event?.ticketUrl).toBe(base.ticketUrl);
    expect(event?.provenance.providerEntityId).toBe("123");
  });

  it("does not invent identity when provider identity or title is missing", () => {
    expect(normalizeExternalEvent({ ...base, providerEntityId: null })).toBeNull();
    expect(normalizeExternalEvent({ ...base, title: " " })).toBeNull();
  });

  it("keeps missing locality and time unknown", () => {
    const event = normalizeExternalEvent({
      ...base,
      localityId: null,
      startsAt: null,
    });
    expect(event?.localityId).toBeNull();
    expect(event?.startsAt).toBeNull();
    expect(isDiscoverableExternalEvent(event!)).toBe(false);
  });

  it("does not treat a stale event as current", () => {
    const event = normalizeExternalEvent({ ...base, freshness: "stale" });
    expect(isDiscoverableExternalEvent(event!)).toBe(false);
  });

  it("does not surface cancelled events as current", () => {
    const event = normalizeExternalEvent({ ...base, cancellation: "cancelled" });
    expect(isDiscoverableExternalEvent(event!)).toBe(false);
  });

  it("does not invent a ticket pathway", () => {
    const event = normalizeExternalEvent({ ...base, ticketUrl: null });
    expect(event?.ticketUrl).toBeNull();
  });
});
