import { describe, expect, it } from "vitest";

import { buildPlaceIndex, type Place } from "./places";
import {
  corridorPlaceIds,
  corridorPlaces,
  corridorWidthKm,
  evidenceLabelFor,
  freshnessLabelFor,
  offRoute,
  routeDiscoveries,
  straightLineSummary,
  type CorridorPlace,
  type RoutePlan,
} from "./road-trip";
import type { WorldEntry } from "./world-data";

function place(
  id: string,
  name: string,
  kind: Place["kind"],
  lat: number,
  lng: number,
  parent: string | null,
): Place {
  return {
    id,
    parent_id: parent,
    kind,
    name,
    slug: id,
    country_code: "GB",
    timezone: "Europe/London",
    currency: "GBP",
    lat,
    lng,
    blurb: "",
  };
}

// A deliberately generic little geography: nothing here is special-cased.
const uk = place("uk", "United Kingdom", "country", 54.5, -3, null);
const birmingham = place("birmingham", "Birmingham", "city", 52.48, -1.9, "uk");
const kingsHeath = place("kings-heath", "Kings Heath", "neighbourhood", 52.43, -1.89, "birmingham");
const worcester = place("worcester", "Worcester", "city", 52.19, -2.22, "uk");
const bristol = place("bristol", "Bristol", "city", 51.45, -2.59, "uk");
const norwich = place("norwich", "Norwich", "city", 52.63, 1.3, "uk");
const index = buildPlaceIndex([uk, birmingham, kingsHeath, worcester, bristol, norwich]);

function entry(id: string, placeId: string, extra: Partial<WorldEntry> = {}): WorldEntry {
  return {
    id,
    placeId,
    layer: "music",
    title: id,
    place: placeId,
    neighbourhood: "",
    x: 50,
    y: 50,
    lat: null,
    lng: null,
    when: "today",
    band: "evening",
    minutes: 90,
    cost: 0,
    summary: "",
    details: [],
    host: "someone",
    verified: false,
    social: "friendly",
    outdoors: false,
    ...extra,
  } as WorldEntry;
}

const plan: RoutePlan = { from: birmingham, to: bristol, mode: "driving", interests: [] };

describe("corridor geometry", () => {
  it("measures how far along and how far off the line a point is", () => {
    const measured = offRoute(birmingham, bristol, worcester);
    expect(measured).not.toBeNull();
    expect(measured!.position).toBeGreaterThan(0.1);
    expect(measured!.position).toBeLessThan(0.6);
    expect(measured!.offRouteKm).toBeLessThan(20);
  });

  it("leaves somewhere in the wrong direction well off the route", () => {
    const measured = offRoute(birmingham, bristol, norwich);
    expect(measured!.offRouteKm).toBeGreaterThan(100);
  });

  it("returns nothing when coordinates are missing", () => {
    expect(offRoute(birmingham, bristol, { lat: null, lng: null })).toBeNull();
  });

  it("widens the corridor with the mode, but never without limit", () => {
    expect(corridorWidthKm("walking", 5)).toBeLessThan(corridorWidthKm("driving", 5));
    expect(corridorWidthKm("driving", 10000)).toBeLessThanOrEqual(45);
  });

  it("finds localities along the way and skips ones nowhere near", () => {
    const hits = corridorPlaces(index, plan, corridorWidthKm("driving", 150));
    const ids = hits.map((h) => h.place.id);
    expect(ids).toContain("worcester");
    expect(ids).not.toContain("norwich");
    // Ordered from the origin towards the destination.
    expect(hits[0]!.position).toBeLessThanOrEqual(hits[hits.length - 1]!.position);
  });

  it("asks about the destination's localities too, bounded", () => {
    const hits = corridorPlaces(index, plan, corridorWidthKm("driving", 150));
    const ids = corridorPlaceIds(index, plan, hits, 10);
    expect(ids).toContain("bristol");
    expect(ids.length).toBeLessThanOrEqual(10);
  });

  it("reports a straight line and no routed distance until a provider exists", () => {
    const summary = straightLineSummary(plan);
    expect(summary.straightLineKm).toBeGreaterThan(50);
    expect(summary.distanceKm).toBeNull();
    expect(summary.source).toBeNull();
  });
});

describe("route discoveries", () => {
  const corridor = new Map<string, CorridorPlace>(
    corridorPlaces(index, plan, corridorWidthKm("driving", 150)).map((h) => [h.place.id, h]),
  );
  const destinationIds = new Set(["bristol"]);

  it("groups by where things sit on the journey", () => {
    const out = routeDiscoveries({
      entries: [
        entry("worcester-gig", "worcester"),
        entry("bristol-gig", "bristol"),
        entry("birmingham-gig", "birmingham"),
      ],
      plan,
      corridor,
      destinationIds,
      routed: false,
    });
    const groups = Object.fromEntries(out.map((d) => [d.entry.id, d.group]));
    expect(groups["bristol-gig"]).toBe("at_destination");
    expect(groups["birmingham-gig"]).toBe("near_start");
    expect(["on_route", "small_detour"]).toContain(groups["worcester-gig"]);
  });

  it("drops anything nowhere near the journey", () => {
    const out = routeDiscoveries({
      entries: [entry("norwich-gig", "norwich")],
      plan,
      corridor,
      destinationIds,
      routed: false,
    });
    expect(out).toHaveLength(0);
  });

  it("never shows a cancelled event", () => {
    const out = routeDiscoveries({
      entries: [entry("off", "bristol", { cancellation: "cancelled" })],
      plan,
      corridor,
      destinationIds,
      routed: false,
    });
    expect(out).toHaveLength(0);
  });

  it("says plainly that detour times are unavailable without a provider", () => {
    const [first] = routeDiscoveries({
      entries: [entry("bristol-gig", "bristol")],
      plan,
      corridor,
      destinationIds,
      routed: false,
    });
    expect(first!.reasons.join(" ")).toContain("unavailable");
  });

  it("gives only reasons it can prove", () => {
    const [first] = routeDiscoveries({
      entries: [
        entry("folk-night", "bristol", {
          title: "Folk night",
          startsAt: "2026-05-02T19:00:00Z",
          sourceName: "Example Listings",
          demonstration: true,
        }),
      ],
      plan: { ...plan, date: "2026-05-02", interests: ["folk"] },
      corridor,
      destinationIds,
      routed: false,
    });
    const reasons = first!.reasons.join(" | ");
    expect(reasons).toContain("Happening on your travel date");
    expect(reasons).toContain("Listed by Example Listings");
    expect(reasons).toContain("Demonstration record");
    expect(reasons).toContain("folk");
    expect(first!.matchedInterests).toEqual(["folk"]);
    expect(first!.evidenceLabel).toBe("Demonstration record");
  });

  it("keeps every supported interest match in the selected order", () => {
    const [first] = routeDiscoveries({
      entries: [entry("market", "bristol", { title: "Food and local history market" })],
      plan: { ...plan, interests: ["Food", "History", "Nature"] },
      corridor,
      destinationIds,
      routed: false,
    });
    expect(first!.matchedInterests).toEqual(["Food", "History"]);
  });

  it("adds no interest evidence when none of the selected words are present", () => {
    const [first] = routeDiscoveries({
      entries: [entry("concert", "bristol", { title: "Evening chamber concert" })],
      plan: { ...plan, interests: ["Food", "Nature"] },
      corridor,
      destinationIds,
      routed: false,
    });
    expect(first!.matchedInterests).toEqual([]);
    expect(first!.reasons.some((reason) => reason.startsWith("Matches"))).toBe(false);
  });

  it("only exposes evidence and freshness labels backed by stored facts", () => {
    expect(
      evidenceLabelFor(
        entry("source", "bristol", {
          sourceName: "Town listings",
          startsAt: "2026-05-02T19:00:00Z",
        }),
      ),
    ).toBe("Event information · Town listings");
    expect(evidenceLabelFor(entry("unknown", "bristol"))).toBeNull();
    expect(freshnessLabelFor(entry("fresh", "bristol", { quality: "recently updated" }))).toBe(
      "Updated recently",
    );
    expect(freshnessLabelFor(entry("unchecked", "bristol", { quality: "unverified" }))).toBeNull();
  });

  it("is deterministic", () => {
    const input = {
      entries: [entry("a", "bristol"), entry("b", "worcester"), entry("c", "birmingham")],
      plan,
      corridor,
      destinationIds,
      routed: false,
    };
    expect(routeDiscoveries(input)).toEqual(routeDiscoveries(input));
  });

  it("works for a journey that leaves the mainland", () => {
    const belfast = place("belfast", "Belfast", "city", 54.6, -5.93, "uk");
    const dublin = place("dublin", "Dublin", "city", 53.35, -6.26, "uk");
    const local = buildPlaceIndex([uk, belfast, dublin]);
    const hits = corridorPlaces(
      local,
      { from: belfast, to: dublin, mode: "driving", interests: [] },
      corridorWidthKm("driving", 140),
    );
    expect(hits.map((h) => h.place.id)).toContain("dublin");
  });
});
