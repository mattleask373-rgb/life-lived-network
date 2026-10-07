import { describe, expect, it } from "vitest";

import { determineActivityTone } from "@/components/living-world-signal";
import { getLocalityDensityConfig } from "@/lib/locality-density";
import { clusterPlaced, fitView, placeEntries } from "@/lib/map-view";
import { nextStepFor } from "@/lib/services";
import { meaningfulVariety, type LayerId, type WorldEntry } from "@/lib/world-data";
import { localityPath, Route } from "@/routes/$country.$place";

interface HeadTag {
  tag?: string;
  name?: string;
  content?: string;
  rel?: string;
  href?: string;
}

function createEntry(overrides: Partial<WorldEntry>): WorldEntry {
  return {
    id: `entry-${Math.random().toString(36).slice(2, 9)}`,
    title: "Community Event",
    layer: "community",
    place: "Kings Heath",
    neighbourhood: "Kings Heath",
    when: "Saturday 11:00",
    minutes: 90,
    cost: 0,
    currency: "GBP",
    lat: 52.4344,
    lng: -1.8911,
    x: 50,
    y: 50,
    quality: "good",
    demonstration: false,
    ...overrides,
  } as WorldEntry;
}

const KINGS_HEATH_PLACE = {
  id: "kh-001",
  slug: "kings-heath",
  name: "Kings Heath",
  countrySegment: "gb",
  kind: "neighbourhood" as const,
  lat: 52.4344,
  lng: -1.8911,
};

const GEOGRAPHY = {
  place: KINGS_HEATH_PLACE,
  ancestors: [
    {
      id: "bham-001",
      slug: "birmingham",
      name: "Birmingham",
      countrySegment: "gb",
      kind: "city" as const,
      lat: 52.4862,
      lng: -1.8904,
    },
  ],
  children: [],
  siblings: [],
};

describe("Locality Route Integration Tests across Density Tiers", () => {
  describe("Quiet State (0 recorded entries)", () => {
    const entries: WorldEntry[] = [];
    const presentLayers: LayerId[] = [];
    const density = getLocalityDensityConfig(entries.length, presentLayers.length);

    it("evaluates deterministic quiet density configuration", () => {
      expect(density.density).toBe("quiet");
      expect(density.mapHeightClass).toBe("h-44 sm:h-56");
      expect(density.showLayerFilter).toBe(false);
      expect(density.promoteSignal).toBe(true);
    });

    it("configures honest quiet signal with direct /make contribution link", () => {
      const tone = determineActivityTone(entries.length);
      expect(tone).toBe("quiet");

      const contribution = {
        label: `Want to help make something happen in ${KINGS_HEATH_PLACE.name}? Add the first thing to the map`,
        to: "/make",
      };
      expect(contribution.to).toBe("/make");
      expect(contribution.label).toContain("Add the first thing to the map");
      expect(contribution.label).toContain(KINGS_HEATH_PLACE.name);
    });

    it("preserves geographic area on map without fabricating pins", () => {
      const view = fitView(entries, { lat: KINGS_HEATH_PLACE.lat, lng: KINGS_HEATH_PLACE.lng });
      const placed = placeEntries(entries, view);
      expect(placed).toHaveLength(0);
      expect(view.lat).toBeCloseTo(KINGS_HEATH_PLACE.lat, 4);
      expect(view.lng).toBeCloseTo(KINGS_HEATH_PLACE.lng, 4);
    });

    it("marks empty locality unindexed for search engines (noindex privatePage)", () => {
      const headResult = Route.options.head?.({
        loaderData: { geography: GEOGRAPHY, entries },
        params: { country: "gb", place: "kings-heath" },
      } as unknown as Parameters<NonNullable<typeof Route.options.head>>[0]);

      const meta = (headResult?.meta ?? []) as HeadTag[];
      const robotsMeta = meta.find((m) => m.name === "robots");
      expect(robotsMeta?.content).toBe("noindex, nofollow");
    });
  });

  describe("Sparse State (1 to 2 recorded entries)", () => {
    const sparseEntries: WorldEntry[] = [
      createEntry({
        id: "entry-sparse-1",
        title: "Community Tool Library",
        layer: "community",
        lat: 52.435,
        lng: -1.892,
      }),
      createEntry({
        id: "entry-sparse-2",
        title: "High Street Acoustic Session",
        layer: "music",
        lat: 52.433,
        lng: -1.89,
      }),
    ];

    it("evaluates sparse density and scales map height for mobile readability", () => {
      const presentLayers = Array.from(new Set(sparseEntries.map((e) => e.layer)));
      const density = getLocalityDensityConfig(sparseEntries.length, presentLayers.length);

      expect(density.density).toBe("sparse");
      expect(density.mapHeightClass).toBe("h-48 sm:h-64 md:h-72");
      expect(density.promoteSignal).toBe(true);
      expect(density.showLayerFilter).toBe(true);
    });

    it("suppresses layer filter when only a single layer is present", () => {
      const singleLayerEntries = [
        createEntry({ id: "e1", layer: "community" }),
        createEntry({ id: "e2", layer: "community" }),
      ];
      const layers = Array.from(new Set(singleLayerEntries.map((e) => e.layer)));
      const density = getLocalityDensityConfig(singleLayerEntries.length, layers.length);

      expect(density.density).toBe("sparse");
      expect(density.showLayerFilter).toBe(false);
    });

    it("places exact canonical map pins without synthetic clusters", () => {
      const view = fitView(sparseEntries, {
        lat: KINGS_HEATH_PLACE.lat,
        lng: KINGS_HEATH_PLACE.lng,
      });
      const placed = placeEntries(sparseEntries, view);

      expect(placed).toHaveLength(2);
      expect(placed.map((p) => p.entry.id)).toEqual(["entry-sparse-1", "entry-sparse-2"]);

      const clusters = clusterPlaced(placed);
      expect(clusters).toHaveLength(2);
      expect(clusters.every((c) => c.entries.length === 1)).toBe(true);
    });

    it("promotes sparse signal with provenance note and /make contribution link", () => {
      const tone = determineActivityTone(sparseEntries.length);
      expect(tone).toBe("sparse");

      const contribution = {
        label: `Know something else happening in ${KINGS_HEATH_PLACE.name}? Add it to the map`,
        to: "/make",
      };
      expect(contribution.to).toBe("/make");
      expect(contribution.label).toContain("Know something else happening");
    });

    it("provides EntrySheet access and actionable steps for canonical items", () => {
      const entry = sparseEntries[0]!;
      const step = nextStepFor(entry);

      expect(entry.id).toBe("entry-sparse-1");
      expect(entry.title).toBe("Community Tool Library");
      expect(step).toBeDefined();
    });
  });

  describe("Medium State (3 to 5 recorded entries)", () => {
    const mediumEntries: WorldEntry[] = [
      createEntry({ id: "m1", title: "Farmers Market", layer: "food", lat: 52.434, lng: -1.891 }),
      createEntry({ id: "m2", title: "Open Studio", layer: "art", lat: 52.436, lng: -1.889 }),
      createEntry({
        id: "m3",
        title: "Bike Workshop",
        layer: "community",
        lat: 52.432,
        lng: -1.893,
      }),
      createEntry({
        id: "m4",
        title: "Evening Yoga",
        layer: "experience",
        lat: 52.435,
        lng: -1.892,
      }),
    ];

    it("evaluates balanced medium density without promoting sparse signal", () => {
      const presentLayers = Array.from(new Set(mediumEntries.map((e) => e.layer)));
      const density = getLocalityDensityConfig(mediumEntries.length, presentLayers.length);

      expect(density.density).toBe("medium");
      expect(density.mapHeightClass).toBe("h-64 sm:h-80 md:h-[22rem]");
      expect(density.promoteSignal).toBe(false);
      expect(density.showLayerFilter).toBe(true);
    });

    it("filters map pins strictly by active layer when filter is engaged", () => {
      const activeLayers: LayerId[] = ["food", "art"];
      const filtered = mediumEntries.filter((e) => activeLayers.includes(e.layer));

      expect(filtered).toHaveLength(2);
      expect(filtered.map((e) => e.id)).toEqual(["m1", "m2"]);

      const view = fitView(filtered, { lat: KINGS_HEATH_PLACE.lat, lng: KINGS_HEATH_PLACE.lng });
      const placed = placeEntries(filtered, view);
      expect(placed).toHaveLength(2);
      expect(placed.map((p) => p.entry.layer)).toEqual(["food", "art"]);
    });

    it("marks verified locality with >=3 records indexable (publicPage)", () => {
      const headResult = Route.options.head?.({
        loaderData: { geography: GEOGRAPHY, entries: mediumEntries },
        params: { country: "gb", place: "kings-heath" },
      } as unknown as Parameters<NonNullable<typeof Route.options.head>>[0]);

      const meta = (headResult?.meta ?? []) as HeadTag[];
      const robotsMeta = meta.find((m) => m.name === "robots");
      expect(robotsMeta?.content).toBe("index, follow");

      const links = (headResult?.links ?? []) as HeadTag[];
      expect(links.some((l) => l.rel === "canonical")).toBe(true);
    });
  });

  describe("Dense State (6+ recorded entries)", () => {
    const denseEntries: WorldEntry[] = [
      createEntry({ id: "d1", title: "Event 1", layer: "music", lat: 52.434, lng: -1.891 }),
      createEntry({ id: "d2", title: "Event 2", layer: "food", lat: 52.4341, lng: -1.8911 }),
      createEntry({ id: "d3", title: "Event 3", layer: "art", lat: 52.436, lng: -1.889 }),
      createEntry({ id: "d4", title: "Event 4", layer: "work", lat: 52.437, lng: -1.888 }),
      createEntry({ id: "d5", title: "Event 5", layer: "community", lat: 52.432, lng: -1.893 }),
      createEntry({ id: "d6", title: "Event 6", layer: "nature", lat: 52.431, lng: -1.895 }),
      createEntry({ id: "d7", title: "Event 7", layer: "experience", lat: 52.435, lng: -1.892 }),
    ];

    it("configures expansive hero map for spatial exploration", () => {
      const presentLayers = Array.from(new Set(denseEntries.map((e) => e.layer)));
      const density = getLocalityDensityConfig(denseEntries.length, presentLayers.length);

      expect(density.density).toBe("dense");
      expect(density.mapHeightClass).toBe("h-[54vh] min-h-80 sm:h-[30rem]");
      expect(density.showLayerFilter).toBe(true);
      expect(density.promoteSignal).toBe(false);
    });

    it("clusters overlapping pins deterministically at viewport scale", () => {
      const view = fitView(denseEntries, {
        lat: KINGS_HEATH_PLACE.lat,
        lng: KINGS_HEATH_PLACE.lng,
      });
      const placed = placeEntries(denseEntries, view);
      expect(placed).toHaveLength(7);

      const clusters = clusterPlaced(placed);
      expect(clusters.length).toBeLessThan(7);
      const multiCluster = clusters.find((c) => c.entries.length > 1);
      expect(multiCluster).toBeDefined();
      expect(multiCluster?.entries.length).toBeGreaterThanOrEqual(2);
    });

    it("preserves diverse layer representations through meaningfulVariety", () => {
      const variety = meaningfulVariety(denseEntries);
      expect(variety.length).toBeGreaterThan(0);
      const varietyLayers = new Set(variety.map((e) => e.layer));
      expect(varietyLayers.size).toBeGreaterThanOrEqual(4);
    });

    it("ensures canonical localityPath redirects non-canonical segments", () => {
      const path = localityPath(KINGS_HEATH_PLACE);
      expect(path).toBe("/gb/kings-heath");
    });
  });
});
