import { describe, expect, it } from "vitest";

import { toPublicLocalityPayload } from "./public-locality-api";
import type { LocalityGeography } from "./locality.functions";
import type { WorldEntry } from "./world-data";

const geography: LocalityGeography = {
  place: {
    id: "place-1",
    name: "Example",
    slug: "example",
    kind: "city",
    countrySegment: "gb",
    blurb: "A real place.",
    lat: 51,
    lng: -1,
  },
  ancestors: [],
  children: [],
  siblings: [],
};

const entry: WorldEntry = {
  id: "listing-1",
  placeId: "place-1",
  layer: "experience",
  title: "Open studio",
  place: "Example",
  neighbourhood: "Centre",
  x: 1,
  y: 1,
  lat: 51,
  lng: -1,
  currency: "GBP",
  when: "today",
  band: "today",
  minutes: 60,
  cost: 0,
  summary: "A recorded local activity.",
  details: [],
  host: "Posted by someone here",
  verified: true,
  social: "friendly",
  outdoors: false,
  community: true,
  quality: "verified",
  kind: "experience",
  skills: ["making"],
  origin: "resident",
};

describe("toPublicLocalityPayload", () => {
  it("keeps indexability tied to real records, not demonstration fixtures", () => {
    const payload = toPublicLocalityPayload(
      geography,
      [{ ...entry, demonstration: true }],
      "2026-10-08T00:00:00.000Z",
    );

    expect(payload.meta.indexable).toBe(false);
    expect(payload.meta.entryCount).toBe(0);
    expect(payload.entries[0]?.demonstration).toBe(true);
  });

  it("maps the canonical locality and public entry fields without UI-only coordinates", () => {
    const payload = toPublicLocalityPayload(
      geography,
      [entry, { ...entry, id: "listing-2" }, { ...entry, id: "listing-3" }],
      "2026-10-08T00:00:00.000Z",
    );

    expect(payload.meta.indexable).toBe(true);
    expect(payload.locality.path).toBe("/gb/example");
    expect(payload.entries[0]).not.toHaveProperty("x");
    expect(payload.entries[0]).not.toHaveProperty("y");
    expect(payload.meta.generatedAt).toBe("2026-10-08T00:00:00.000Z");
  });
});
