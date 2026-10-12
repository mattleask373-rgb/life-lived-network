import { describe, expect, it } from "vitest";
import {
  TICKETMASTER_PROVIDER,
  evaluateEventFreshness,
  isDiscoverableExternalEvent,
  isSameExternalEvent,
  normalizeExternalEvent,
  resolveEventLocality,
} from "./external-world";
import { parseTicketmasterEvent, parseTicketmasterResponse } from "./ticketmaster-adapter";
import {
  CANCELLED_FIXTURE,
  DRAKE_BIRMINGHAM_FIXTURE,
  DUBLIN_COMEDY_FIXTURE,
  POSTPONED_FIXTURE,
  UNKNOWN_LOCALITY_FIXTURE,
} from "./fixtures/ticketmaster-fixtures";
import { PlaceIndex, buildPlaceIndex } from "./places";

const MOCK_PLACES = [
  {
    id: "birmingham-city",
    parent_id: "west-midlands",
    kind: "city" as const,
    name: "Birmingham",
    slug: "birmingham",
    country_code: "GB",
    timezone: "Europe/London",
    currency: "GBP",
    coordinates: { lat: 52.48, lng: -1.9 },
    blurb: "Major city in the West Midlands.",
  },
  {
    id: "dublin-city",
    parent_id: "leinster",
    kind: "city" as const,
    name: "Dublin",
    slug: "dublin",
    country_code: "IE",
    timezone: "Europe/Dublin",
    currency: "EUR",
    coordinates: { lat: 53.35, lng: -6.26 },
    blurb: "Capital of Ireland.",
  },
];

const mockPlaceIndex: PlaceIndex = buildPlaceIndex(MOCK_PLACES);

describe("P2-A: Ticketmaster adapter & External World boundary", () => {
  const fixedNow = new Date("2026-10-06T18:00:00Z");

  it("1. fixture -> normalized event", () => {
    const event = parseTicketmasterEvent(DRAKE_BIRMINGHAM_FIXTURE, {
      placeIndex: mockPlaceIndex,
      now: fixedNow,
      observedAt: "2026-10-06T12:00:00Z",
    });

    expect(event).not.toBeNull();
    expect(event?.id).toBe("ticketmaster:tm-drake-birmingham-2026");
    expect(event?.title).toBe("Drake — $ell Your Soul Tour");
    expect(event?.startsAt).toBe("2026-11-20T19:30:00Z");
    expect(event?.endsAt).toBe("2026-11-20T23:00:00Z");
    expect(event?.timezone).toBe("Europe/London");
    expect(event?.venueName).toBe("Utilita Arena Birmingham");
    expect(event?.localityId).toBe("birmingham-city");
    expect(event?.localityName).toBe("Birmingham");
    expect(event?.organiser).toBe("Drake");
    expect(event?.ticketUrl).toBe("https://www.ticketmaster.co.uk/event/tm-drake-birmingham-2026");
    expect(event?.cancellation).toBeNull();
    expect(event?.freshness).toBe("current");
    expect(isDiscoverableExternalEvent(event!)).toBe(true);
  });

  it("2. missing provider id or title rejection", () => {
    expect(parseTicketmasterEvent({ name: "Valid Title" })).toBeNull();
    expect(parseTicketmasterEvent({ id: "valid-id" })).toBeNull();
    expect(parseTicketmasterEvent({ id: "valid-id", name: "   " })).toBeNull();
  });

  it("3. missing optional data remains unknown without fabricating values", () => {
    const minimal = {
      id: "min-01",
      name: "Minimalist Workshop",
      dates: { start: { dateTime: "2026-11-01T10:00:00Z" } },
    };
    const event = parseTicketmasterEvent(minimal, { now: fixedNow });
    expect(event).not.toBeNull();
    expect(event?.venueName).toBeNull();
    expect(event?.localityId).toBeNull();
    expect(event?.ticketUrl).toBeNull();
    expect(event?.endsAt).toBeNull();
    expect(event?.description).toBeNull();
  });

  it("4. deterministic locality resolution against PlaceIndex", () => {
    const resolved = resolveEventLocality("Birmingham", "GB", mockPlaceIndex);
    expect(resolved?.id).toBe("birmingham-city");
    expect(resolved?.country_code).toBe("GB");
  });

  it("5. unresolved locality does not become falsely local or guessed", () => {
    const event = parseTicketmasterEvent(UNKNOWN_LOCALITY_FIXTURE, {
      placeIndex: mockPlaceIndex,
      now: fixedNow,
    });
    expect(event).not.toBeNull();
    expect(event?.localityId).toBeNull();
    expect(isDiscoverableExternalEvent(event!)).toBe(false);
  });

  it("6. stable provider identity (provider + providerEntityId)", () => {
    const a = parseTicketmasterEvent(DRAKE_BIRMINGHAM_FIXTURE, { now: fixedNow })!;
    const b = parseTicketmasterEvent(DRAKE_BIRMINGHAM_FIXTURE, { now: fixedNow })!;
    expect(isSameExternalEvent(a, b)).toBe(true);
  });

  it("7. two distinct events are not merged even if title/venue/date match", () => {
    const a = normalizeExternalEvent({
      provider: "ticketmaster",
      providerEntityId: "gig-1",
      title: "Indie Rock Night",
      venueName: "The O2",
      startsAt: "2026-11-01T20:00:00Z",
      observedAt: "2026-10-06T12:00:00Z",
      freshness: "current",
    })!;

    const b = normalizeExternalEvent({
      provider: "ticketmaster",
      providerEntityId: "gig-2",
      title: "Indie Rock Night",
      venueName: "The O2",
      startsAt: "2026-11-01T20:00:00Z",
      observedAt: "2026-10-06T12:00:00Z",
      freshness: "current",
    })!;

    expect(isSameExternalEvent(a, b)).toBe(false);
  });

  it("8. current vs stale vs expired evaluation", () => {
    const current = evaluateEventFreshness({
      startsAt: "2026-11-01T20:00:00Z",
      observedAt: "2026-10-06T12:00:00Z",
      now: fixedNow,
    });
    expect(current).toBe("current");

    const stale = evaluateEventFreshness({
      startsAt: "2026-11-01T20:00:00Z",
      observedAt: "2026-09-01T12:00:00Z", // 35 days ago
      now: fixedNow,
      staleAfterHours: 168,
    });
    expect(stale).toBe("stale");

    const expired = evaluateEventFreshness({
      startsAt: "2026-09-01T20:00:00Z",
      observedAt: "2026-09-01T12:00:00Z",
      now: fixedNow,
    });
    expect(expired).toBe("expired");
  });

  it("9. cancellation and postponement states are preserved and undiscoverable", () => {
    const cancelled = parseTicketmasterEvent(CANCELLED_FIXTURE, {
      placeIndex: mockPlaceIndex,
      now: fixedNow,
    })!;
    expect(cancelled.cancellation).toBe("cancelled");
    expect(isDiscoverableExternalEvent(cancelled)).toBe(false);

    const postponed = parseTicketmasterEvent(POSTPONED_FIXTURE, {
      placeIndex: mockPlaceIndex,
      now: fixedNow,
    })!;
    expect(postponed.cancellation).toBe("postponed");
    expect(isDiscoverableExternalEvent(postponed)).toBe(false);
  });

  it("10. deep-link and source URL preservation", () => {
    const event = parseTicketmasterEvent(DRAKE_BIRMINGHAM_FIXTURE, { now: fixedNow })!;
    expect(event.ticketUrl).toBe("https://www.ticketmaster.co.uk/event/tm-drake-birmingham-2026");
    expect(event.sourceUrl).toBe("https://www.ticketmaster.co.uk/event/tm-drake-birmingham-2026");
  });

  it("11. international locality and timezone handling (Dublin)", () => {
    const event = parseTicketmasterEvent(DUBLIN_COMEDY_FIXTURE, {
      placeIndex: mockPlaceIndex,
      now: fixedNow,
    })!;
    expect(event.localityId).toBe("dublin-city");
    expect(event.timezone).toBe("Europe/Dublin");
    expect(event.startsAt).toBe("2026-12-05T20:00:00Z");
  });

  it("12. parseTicketmasterResponse handles embedded arrays and reports skipped", () => {
    const payload = {
      _embedded: {
        events: [
          DRAKE_BIRMINGHAM_FIXTURE,
          { id: "invalid-record", name: "" }, // skipped
        ],
      },
    };
    const res = parseTicketmasterResponse(payload, { placeIndex: mockPlaceIndex, now: fixedNow });
    expect(res.events).toHaveLength(1);
    expect(res.skipped).toHaveLength(1);
    expect(res.skipped[0]).toContain("Incomplete or unidentifiable event record: invalid-record");
  });

  it("13. Ticketmaster provider descriptor does not leak UI types", () => {
    expect(TICKETMASTER_PROVIDER.id).toBe("ticketmaster");
    expect(TICKETMASTER_PROVIDER.kind).toBe("events");
    expect(TICKETMASTER_PROVIDER.capabilities).toContain("ticket_links");
  });
});
