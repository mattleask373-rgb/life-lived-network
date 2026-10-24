import { describe, expect, it } from "vitest";

import { fixtureAdapter, fixturePayload, FIXTURE_LABEL, FIXTURE_SOURCE_KEY } from "./fixture-source";
import { normaliseEvent } from "./normalise";
import {
  ticketmasterAdapter,
  ticketmasterGeoHash,
  ticketmasterQuery,
  TICKETMASTER_KEY,
  TICKETMASTER_ROOT,
} from "./ticketmaster";

const STARTS_AT = "2027-06-10T18:00:00Z";
const ENDS_AT = "2027-06-10T21:00:00Z";
const EVENT_URL = "https://tickets.example.test/events/event-123";

function providerEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "event-123",
    name: "Live music &amp; friends",
    info: { text: "<p>A real concert description</p><script>unsafe()</script>" },
    pleaseNote: "Bring a photo ID",
    url: EVENT_URL,
    dates: {
      start: { dateTime: STARTS_AT },
      end: { dateTime: ENDS_AT },
      timezone: "Europe/London",
      status: { code: "onsale" },
    },
    classifications: [{ segment: { name: "Music" } }],
    priceRanges: [{ min: 12, currency: "gbp" }],
    images: [{ url: "https://images.example.test/event-123.jpg", width: 800 }],
    _embedded: {
      venues: [
        {
          name: "Town Hall",
          city: { name: "Birmingham" },
          location: { latitude: "52.48", longitude: "-1.9" },
        },
      ],
      attractions: [{ name: "The Example Band" }],
    },
    ...overrides,
  };
}

function payload(...events: Record<string, unknown>[]): unknown {
  return { _embedded: { events } };
}

describe("Ticketmaster offline adapter boundary", () => {
  it("builds a bounded locality/date query without putting credentials in the query", () => {
    const query = ticketmasterQuery({
      countryCode: "gb",
      lat: 52.48,
      lng: -1.9,
      radiusKm: 20.4,
      startsAfter: "2027-01-01T00:00:00.000Z",
      endsBefore: "2027-02-01T00:00:00.000Z",
      size: 500,
      page: -3,
    });

    expect(TICKETMASTER_ROOT).toBe("https://app.ticketmaster.com/discovery/v2/events.json");
    expect(TICKETMASTER_KEY).toBe("ticketmaster-discovery");
    expect(query.get("countryCode")).toBe("GB");
    expect(query.get("geoPoint")).toBe(ticketmasterGeoHash(52.48, -1.9));
    expect(query.get("radius")).toBe("20");
    expect(query.get("unit")).toBe("km");
    expect(query.get("startDateTime")).toBe("2027-01-01T00:00:00Z");
    expect(query.get("endDateTime")).toBe("2027-02-01T00:00:00Z");
    expect(query.get("size")).toBe("100");
    expect(query.get("page")).toBe("0");
    expect(query.get("sort")).toBe("date,asc");
    expect(query.has("apikey")).toBe(false);
    expect(query.has("apiKey")).toBe(false);
  });

  it("rejects malformed time windows and does not invent a geohash for invalid coordinates", () => {
    expect(() =>
      ticketmasterQuery({
        countryCode: "PT",
        lat: 91,
        lng: -8,
        startsAfter: "2027-02-01",
        endsBefore: "2027-01-01",
      }),
    ).toThrow(RangeError);

    const noCoordinates = ticketmasterQuery({
      countryCode: "PT",
      lat: Number.NaN,
      lng: -8,
      startsAfter: "2027-01-01T00:00:00Z",
      endsBefore: "2027-02-01T00:00:00Z",
    });
    expect(noCoordinates.has("geoPoint")).toBe(false);
    expect(noCoordinates.has("radius")).toBe(false);
    expect(ticketmasterGeoHash(Number.POSITIVE_INFINITY, -8)).toBeNull();
    expect(ticketmasterGeoHash(52, 181)).toBeNull();
    expect(ticketmasterGeoHash(52, -8)).toMatch(/^[0123456789bcdefghjkmnpqrstuvwxyz]{5}$/);
    expect(() => ticketmasterGeoHash(52, -8, 0)).toThrow(RangeError);
  });

  it("normalizes a representative event while preserving provenance, time, locality and ticket link", () => {
    const result = ticketmasterAdapter.parse(payload(providerEvent()));

    expect(result.skipped).toEqual([]);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      externalId: "event-123",
      title: "Live music & friends",
      summary: "A real concert description",
      details: ["Bring a photo ID"],
      startsAt: new Date(STARTS_AT).toISOString(),
      endsAt: new Date(ENDS_AT).toISOString(),
      timezone: "Europe/London",
      venueName: "Town Hall",
      neighbourhood: "Birmingham",
      lat: 52.48,
      lng: -1.9,
      category: "music",
      organiser: "The Example Band",
      sourceUrl: EVENT_URL,
      ticketUrl: EVENT_URL,
      cost: 12,
      currency: "GBP",
      state: "live",
    });
    expect(result.events[0]?.images).toEqual([
      {
        url: "https://images.example.test/event-123.jpg",
        credit: "Ticketmaster",
        alt: "Live music & friends",
        mayDisplay: true,
      },
    ]);

    const normalized = normaliseEvent(result.events[0]!);
    expect(normalized).not.toBeNull();
    expect(normalized?.externalId).toBe("event-123");
    expect(normalized?.startsAt).toBe(new Date(STARTS_AT).toISOString());
    expect(normalized?.sourceUrl).toBe(EVENT_URL);
  });

  it("keeps unknown optional facts empty instead of inventing them", () => {
    const result = ticketmasterAdapter.parse(
      payload(
        providerEvent({
          info: undefined,
          pleaseNote: undefined,
          priceRanges: undefined,
          images: undefined,
          _embedded: {
            venues: [{ name: "A room without coordinates", city: { name: "Lisbon" } }],
          },
        }),
      ),
    );

    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      summary: "",
      details: [],
      venueName: "A room without coordinates",
      neighbourhood: "Lisbon",
      lat: null,
      lng: null,
      organiser: "",
      cost: null,
      currency: "",
      images: [],
    });
    expect(result.events[0]).not.toHaveProperty("ticketInventory");
    expect(result.events[0]).not.toHaveProperty("ticketsAvailable");
  });

  it("skips missing identity/time and refuses to guess an IANA timezone for a local wall time", () => {
    const result = ticketmasterAdapter.parse(
      payload(
        providerEvent({ id: "", name: "Missing ID" }),
        providerEvent({ name: "   " }),
        providerEvent({ dates: { start: { dateTime: "not-a-date" }, timezone: "UTC" } }),
        providerEvent({
          dates: { start: { localDate: "2027-06-10", localTime: "19:30:00" } },
        }),
      ),
    );

    expect(result.events).toEqual([]);
    expect(result.skipped).toHaveLength(4);
    expect(result.skipped.every((reason) => reason.startsWith("Incomplete record"))).toBe(true);
  });

  it("converts source local wall time in its explicit timezone and rejects nonexistent DST times", () => {
    const validLocalTime = ticketmasterAdapter.parse(
      payload(
        providerEvent({
          dates: {
            start: { localDate: "2027-06-10", localTime: "19:30:00" },
            timezone: "Europe/London",
            status: { code: "onsale" },
          },
        }),
      ),
    );
    expect(validLocalTime.events[0]?.startsAt).toBe("2027-06-10T18:30:00.000Z");

    const nonexistentTime = ticketmasterAdapter.parse(
      payload(
        providerEvent({
          dates: {
            start: { localDate: "2027-03-28", localTime: "01:30:00" },
            timezone: "Europe/London",
            status: { code: "onsale" },
          },
        }),
      ),
    );
    expect(nonexistentTime.events).toEqual([]);
    expect(nonexistentTime.skipped).toHaveLength(1);
  });

  it("preserves cancellation and postponement as different provider states", () => {
    const result = ticketmasterAdapter.parse(
      payload(
        providerEvent({
          id: "cancelled",
          dates: {
            start: { dateTime: STARTS_AT },
            timezone: "Europe/London",
            status: { code: "cancelled" },
          },
        }),
        providerEvent({
          id: "postponed",
          dates: {
            start: { dateTime: STARTS_AT },
            timezone: "Europe/London",
            status: { code: "rescheduled" },
          },
        }),
      ),
    );

    expect(result.events.map((event) => [event.externalId, event.state])).toEqual([
      ["cancelled", "cancelled"],
      ["postponed", "postponed"],
    ]);
  });

  it("keeps the event record but strips unusable ticket/source links", () => {
    const result = ticketmasterAdapter.parse(
      payload(providerEvent({ url: "javascript:alert(1)" })),
    );

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.sourceUrl).toBe("");
    expect(result.events[0]?.ticketUrl).toBe("");
  });

  it("reports provider faults and tolerates malformed payload shapes without throwing", () => {
    const fault = ticketmasterAdapter.parse({
      fault: { faultstring: "Provider error <script>secret()</script>" },
    });
    expect(fault.events).toEqual([]);
    expect(fault.skipped).toEqual(["Provider error"]);

    expect(ticketmasterAdapter.parse(null)).toEqual({ events: [], skipped: [] });
    expect(ticketmasterAdapter.parse({ _embedded: { events: "not-an-array" } })).toEqual({
      events: [],
      skipped: [],
    });
  });

  it("keeps fixture records clearly labeled as demonstration data and uses the same provider parser", () => {
    const result = fixtureAdapter.parse(
      fixturePayload({
        lat: 52.48,
        lng: -1.9,
        localityName: "Birmingham",
        timezone: "Europe/London",
        now: new Date("2027-01-01T12:00:00.000Z"),
      }),
    );

    expect(fixtureAdapter.key).toBe(FIXTURE_SOURCE_KEY);
    expect(result.events.length).toBeGreaterThanOrEqual(9);
    expect(result.events.every((event) => event.title.includes(FIXTURE_LABEL))).toBe(true);
    expect(result.events.map((event) => event.externalId)).toContain("fixture-evening-music");
    expect(result.events.map((event) => event.externalId)).toContain("fixture-cancelled");
    expect(result.events.map((event) => event.externalId)).toContain("fixture-postponed");
    expect(result.events.map((event) => event.externalId)).toContain("fixture-no-coordinates");
    expect(result.events.find((event) => event.externalId === "fixture-cancelled")?.state).toBe(
      "cancelled",
    );
    expect(result.events.find((event) => event.externalId === "fixture-postponed")?.state).toBe(
      "postponed",
    );
    expect(result.events.find((event) => event.externalId === "fixture-no-coordinates")).toMatchObject({
      lat: null,
      lng: null,
    });
    expect(result.skipped.length).toBeGreaterThanOrEqual(1);
  });
});
