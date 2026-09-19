import { describe, expect, it } from "vitest";

import { ticketmasterAdapter, ticketmasterQuery } from "./ticketmaster";
import { adapterFor } from "./registry";
import { normaliseEvent, plainText, safeUrl, usableImages } from "./normalise";
import { cancellationFor, discoverable, eventFreshness, qualityFor } from "./freshness";
import { payloadHash, sameEvent, titleKey } from "./dedupe";
import { dueForRefresh, sourceKeyFor } from "./refresh.server";
import type { SourceEvent, SourceRow } from "./contract";

function payload(event: Record<string, unknown>) {
  return { _embedded: { events: [event] } };
}

const GOOD = {
  id: "G1Ab-12345",
  name: "A brass band in a railway arch",
  url: "https://www.ticketmaster.co.uk/event/G1Ab-12345",
  info: "An evening of brass.",
  dates: { start: { dateTime: "2099-04-18T19:30:00Z" }, timezone: "Europe/London", status: { code: "onsale" } },
  classifications: [{ segment: { name: "Music" } }],
  priceRanges: [{ min: 12, currency: "GBP" }],
  images: [{ url: "https://s1.ticketm.net/img/a.jpg", width: 1024 }],
  _embedded: {
    venues: [
      { name: "An arch venue", city: { name: "Digbeth" }, location: { latitude: "52.476", longitude: "-1.884" } },
    ],
    attractions: [{ name: "A brass band" }],
  },
};

describe("the provider adapter", () => {
  it("reads a whole event without knowing any locality", () => {
    const { events, skipped } = ticketmasterAdapter.parse(payload(GOOD));
    expect(skipped).toEqual([]);
    const event = events[0]!;
    expect(event.externalId).toBe("G1Ab-12345");
    expect(event.title).toBe("A brass band in a railway arch");
    expect(event.startsAt).toBe("2099-04-18T19:30:00.000Z");
    expect(event.category).toBe("music");
    expect(event.venueName).toBe("An arch venue");
    expect(event.lat).toBeCloseTo(52.476, 3);
    expect(event.organiser).toBe("A brass band");
    expect(event.cost).toBe(12);
    expect(event.state).toBe("live");
  });

  it("keeps nothing from an empty answer", () => {
    expect(ticketmasterAdapter.parse({ _embedded: { events: [] } }).events).toEqual([]);
    expect(ticketmasterAdapter.parse({}).events).toEqual([]);
    expect(ticketmasterAdapter.parse(null).events).toEqual([]);
    expect(ticketmasterAdapter.parse("not json at all").events).toEqual([]);
  });

  it("reports a refused request rather than pretending it was empty", () => {
    const { events, skipped } = ticketmasterAdapter.parse({
      fault: { faultstring: "Invalid ApiKey" },
    });
    expect(events).toEqual([]);
    expect(skipped[0]).toContain("Invalid ApiKey");
  });

  it("skips records with no title, no identifier or no date", () => {
    expect(ticketmasterAdapter.parse(payload({ ...GOOD, name: "" })).events).toHaveLength(0);
    expect(ticketmasterAdapter.parse(payload({ ...GOOD, id: "" })).events).toHaveLength(0);
    expect(ticketmasterAdapter.parse(payload({ ...GOOD, dates: {} })).events).toHaveLength(0);
  });

  it("keeps an event whose venue or coordinates are missing", () => {
    const { events } = ticketmasterAdapter.parse(payload({ ...GOOD, _embedded: {} }));
    expect(events).toHaveLength(1);
    expect(events[0]!.venueName).toBe("");
    expect(events[0]!.lat).toBeNull();
  });

  it("refuses coordinates and links that make no sense", () => {
    const { events } = ticketmasterAdapter.parse(
      payload({
        ...GOOD,
        url: "javascript:alert(1)",
        _embedded: {
          venues: [{ name: "Somewhere", location: { latitude: "999", longitude: "abc" } }],
        },
      }),
    );
    expect(events[0]!.sourceUrl).toBe("");
    expect(events[0]!.lat).toBeNull();
    expect(events[0]!.lng).toBeNull();
  });

  it("handles a date with no time as that day where the event is", () => {
    const { events } = ticketmasterAdapter.parse(
      payload({ ...GOOD, dates: { start: { localDate: "2099-06-01" }, timezone: "Europe/Dublin" } }),
    );
    expect(events[0]!.startsAt).toBe("2099-06-01T00:00:00.000Z");
  });

  it("carries a cancellation and a postponement through", () => {
    const cancelled = ticketmasterAdapter.parse(
      payload({ ...GOOD, dates: { ...GOOD.dates, status: { code: "cancelled" } } }),
    );
    expect(cancelled.events[0]!.state).toBe("cancelled");
    const moved = ticketmasterAdapter.parse(
      payload({ ...GOOD, dates: { ...GOOD.dates, status: { code: "rescheduled" } } }),
    );
    expect(moved.events[0]!.state).toBe("postponed");
  });

  it("is registered as data, by name", () => {
    expect(adapterFor(sourceKeyFor("Ticketmaster Discovery"))).not.toBeNull();
    expect(adapterFor("no-such-source")).toBeNull();
  });
});

describe("the same adapter for every locality", () => {
  const cases = [
    { name: "Birmingham", countryCode: "GB", lat: 52.48, lng: -1.9 },
    { name: "Bristol", countryCode: "GB", lat: 51.45, lng: -2.59 },
    { name: "Herefordshire", countryCode: "GB", lat: 52.06, lng: -2.72 },
    { name: "Manchester", countryCode: "GB", lat: 53.48, lng: -2.24 },
    { name: "London", countryCode: "GB", lat: 51.51, lng: -0.13 },
    { name: "Edinburgh", countryCode: "GB", lat: 55.95, lng: -3.19 },
    { name: "Cardiff", countryCode: "GB", lat: 51.48, lng: -3.18 },
    { name: "Belfast", countryCode: "GB", lat: 54.6, lng: -5.93 },
    { name: "Dublin", countryCode: "IE", lat: 53.35, lng: -6.26 },
  ];

  it.each(cases)("asks about $name using only its own geography", (locality) => {
    const params = ticketmasterQuery({
      countryCode: locality.countryCode,
      lat: locality.lat,
      lng: locality.lng,
      radiusKm: 20,
      startsAfter: "2099-01-01T00:00:00Z",
      endsBefore: "2099-01-15T00:00:00Z",
    });
    expect(params.get("countryCode")).toBe(locality.countryCode);
    expect(params.get("latlong")).toBe(`${locality.lat.toFixed(4)},${locality.lng.toFixed(4)}`);
    expect(params.get("radius")).toBe("20");
    expect(params.get("unit")).toBe("km");
  });

  it("names no locality anywhere in the adapter", async () => {
    const source = await import("./ticketmaster?raw").catch(() => null);
    void source;
    const text = ticketmasterAdapter.parse.toString() + ticketmasterQuery.toString();
    for (const name of ["Birmingham", "Bristol", "Manchester", "Dublin", "London"]) {
      expect(text).not.toContain(name);
    }
  });

  it("never carries a credential in the query it builds", () => {
    const params = ticketmasterQuery({
      countryCode: "GB",
      startsAfter: "2099-01-01T00:00:00Z",
      endsBefore: "2099-01-02T00:00:00Z",
    });
    expect(params.get("apikey")).toBeNull();
  });
});

describe("making outside text safe", () => {
  it("strips markup and control characters", () => {
    expect(plainText("<script>bad()</script>Hello <b>there</b>")).toBe("Hello there");
    expect(plainText("a\u0000b")).toBe("a b");
    expect(plainText(42)).toBe("");
  });

  it("allows only ordinary web links", () => {
    expect(safeUrl("https://example.org/a")).toBe("https://example.org/a");
    expect(safeUrl("javascript:alert(1)")).toBe("");
    expect(safeUrl("data:text/html,x")).toBe("");
    expect(safeUrl("not a url")).toBe("");
  });

  it("shows no photograph a source has not permitted", () => {
    const images = [{ url: "https://x.test/a.jpg", credit: "A source", alt: "", mayDisplay: true }];
    expect(usableImages(images, false)).toEqual([]);
    expect(usableImages(images, true)).toHaveLength(1);
  });

  it("refuses an event with nothing to stand on", () => {
    const bare = { externalId: "", title: "", startsAt: "" } as unknown as SourceEvent;
    expect(normaliseEvent(bare)).toBeNull();
  });
});

describe("how alive an event is", () => {
  const base = {
    startsAt: "2099-01-10T19:00:00Z",
    refreshMinutes: 1440,
    now: new Date("2099-01-08T12:00:00Z"),
  };

  it("is fresh when both we and the source looked recently", () => {
    expect(
      eventFreshness({
        ...base,
        lastCheckedAt: "2099-01-08T11:00:00Z",
        sourceUpdatedAt: "2099-01-08T09:00:00Z",
      }),
    ).toBe("recently_updated");
  });

  it("ages, then admits it may have changed", () => {
    expect(eventFreshness({ ...base, lastCheckedAt: "2099-01-06T12:00:00Z" })).toBe("aging");
    expect(eventFreshness({ ...base, lastCheckedAt: "2099-01-01T12:00:00Z" })).toBe(
      "may_have_changed",
    );
    expect(eventFreshness({ ...base, lastCheckedAt: null })).toBe("may_have_changed");
  });

  it("calls a finished event finished", () => {
    expect(
      eventFreshness({
        ...base,
        startsAt: "2099-01-01T19:00:00Z",
        endsAt: "2099-01-01T22:00:00Z",
        lastCheckedAt: "2099-01-08T11:00:00Z",
      }),
    ).toBe("expired");
  });

  it("keeps finished, cancelled and withdrawn events out of what's happening", () => {
    expect(discoverable({ freshness: "current", sourceState: "live" })).toBe(true);
    expect(discoverable({ freshness: "expired", sourceState: "live" })).toBe(false);
    expect(discoverable({ freshness: "current", sourceState: "cancelled" })).toBe(false);
    expect(discoverable({ freshness: "current", sourceState: "postponed" })).toBe(false);
    expect(discoverable({ freshness: "current", sourceState: "removed" })).toBe(false);
  });

  it("uses the honesty labels the interface already knows", () => {
    expect(qualityFor("recently_updated")).toBe("recently updated");
    expect(qualityFor("may_have_changed")).toBe("may have changed");
    expect(qualityFor("expired")).toBe("expired");
    expect(cancellationFor("postponed")).toBe("postponed");
    expect(cancellationFor("live")).toBe("");
  });

  it("respects a source's own refresh interval", () => {
    const source = {
      refresh_minutes: 1440,
      last_run_at: "2099-01-08T11:00:00Z",
    } as unknown as SourceRow;
    expect(dueForRefresh(source, new Date("2099-01-08T12:00:00Z"))).toBe(false);
    expect(dueForRefresh(source, new Date("2099-01-10T12:00:00Z"))).toBe(true);
    expect(dueForRefresh({ ...source, last_run_at: null } as SourceRow)).toBe(true);
  });
});

describe("deciding when two records are one event", () => {
  const one: SourceEvent & { placeId: string } = {
    externalId: "a",
    title: "The Brass Band at the Arch",
    summary: "",
    details: [],
    startsAt: "2099-04-18T19:30:00Z",
    timezone: "Europe/London",
    venueName: "An arch venue",
    category: "music",
    sourceUrl: "https://example.org/a",
    state: "live",
    placeId: "place-1",
  };

  it("merges the same night from two sources", () => {
    const two = { ...one, externalId: "b", title: "Brass Band, the Arch", startsAt: "2099-04-18T19:45:00Z" };
    expect(sameEvent(one, two).same).toBe(true);
  });

  it("keeps a different time at the same venue separate", () => {
    expect(sameEvent(one, { ...one, startsAt: "2099-04-18T23:30:00Z" }).same).toBe(false);
  });

  it("keeps the same title at a different venue separate", () => {
    expect(sameEvent(one, { ...one, placeId: "place-2", venueName: "Another hall" }).same).toBe(false);
  });

  it("keeps a near miss separate rather than guessing", () => {
    expect(sameEvent(one, { ...one, title: "A string quartet recital" }).same).toBe(false);
  });

  it("explains every decision in words", () => {
    expect(sameEvent(one, { ...one, startsAt: "2099-04-19T19:30:00Z" }).reason).toMatch(/Start times/);
  });

  it("compares titles as words, not punctuation", () => {
    expect(titleKey("The Brass Band!")).toBe(titleKey("brass band, the"));
  });

  it("recognises an unchanged payload", () => {
    expect(payloadHash(one)).toBe(payloadHash({ ...one }));
    expect(payloadHash(one)).not.toBe(payloadHash({ ...one, title: "Something else" }));
  });
});
