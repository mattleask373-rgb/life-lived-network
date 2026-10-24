import { describe, expect, it } from "vitest";

import { relatedEntries, type WorldEntry } from "./world-data";

function entry(overrides: Partial<WorldEntry> & Pick<WorldEntry, "id">): WorldEntry {
  return {
    id: overrides.id,
    layer: "music",
    title: overrides.id,
    place: "Somewhere",
    neighbourhood: "Somewhere",
    x: 50,
    y: 50,
    lat: null,
    lng: null,
    when: "Tonight",
    band: "tonight",
    minutes: 60,
    cost: 0,
    summary: "",
    details: [],
    host: "A local host",
    verified: false,
    social: "friendly",
    outdoors: false,
    ...overrides,
  };
}

describe("global related-entry proximity", () => {
  it("uses real coordinates for nearby points across the date line despite colliding stylized positions", () => {
    const target = entry({
      id: "target",
      placeId: "place-target",
      lat: 0,
      lng: 179.5,
      x: 50,
      y: 50,
      neighbourhood: "East",
    });
    const farAcrossRegion = entry({
      id: "a-far",
      placeId: "place-far",
      lat: 0,
      lng: 150,
      x: 50,
      y: 50,
      neighbourhood: "Far",
    });
    const nearbyAcrossDateLine = entry({
      id: "z-near",
      placeId: "place-near",
      lat: 0,
      lng: -179.5,
      x: 50,
      y: 50,
      neighbourhood: "West",
    });

    expect(relatedEntries([target, farAcrossRegion, nearbyAcrossDateLine], target, 2)[0]?.id).toBe(
      "z-near",
    );
  });

  it("does not let a repeated neighbourhood label override real distance when place IDs differ", () => {
    const target = entry({
      id: "tokyo",
      placeId: "place-tokyo",
      lat: 35.68,
      lng: 139.69,
      neighbourhood: "Downtown",
    });
    const farSameLabel = entry({
      id: "far-downtown",
      placeId: "place-los-angeles",
      lat: 34.05,
      lng: -118.24,
      neighbourhood: "Downtown",
    });
    const nearbyOtherLabel = entry({
      id: "near-tokyo",
      placeId: "place-tokyo-nearby",
      lat: 35.69,
      lng: 139.7,
      neighbourhood: "Shinagawa",
    });

    expect(relatedEntries([target, farSameLabel, nearbyOtherLabel], target, 2)[0]?.id).toBe(
      "near-tokyo",
    );
  });

  it("keeps the stylized x/y fallback for entries without real coordinates", () => {
    const target = entry({ id: "target", neighbourhood: "A", x: 50, y: 50 });
    const nearby = entry({ id: "nearby", neighbourhood: "B", x: 51, y: 50 });
    const far = entry({ id: "far", neighbourhood: "C", x: 90, y: 90 });

    expect(relatedEntries([target, far, nearby], target, 2)[0]?.id).toBe("nearby");
  });

  it("keeps proximity primary and same-place/time-band nudges small when coordinates are known", () => {
    const target = entry({
      id: "target",
      placeId: "place-a",
      lat: 35.68,
      lng: 139.69,
      neighbourhood: "Area A",
    });
    const samePlaceFarther = entry({
      id: "same-place",
      placeId: "place-a",
      lat: 35.68,
      lng: 139.8,
      neighbourhood: "Area A",
    });
    const nearerDifferentPlace = entry({
      id: "nearer",
      placeId: "place-b",
      lat: 35.6802,
      lng: 139.6902,
      neighbourhood: "Area B",
    });

    expect(relatedEntries([target, samePlaceFarther, nearerDifferentPlace], target, 2)[0]?.id).toBe(
      "nearer",
    );
  });
});
