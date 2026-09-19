import { describe, expect, it } from "vitest";

import {
  FIXTURE_LABEL,
  FIXTURE_SOURCE_KEY,
  fixturePayload,
  fixtureAdapter,
} from "./fixture-source";

const request = {
  lat: 52.431,
  lng: -1.893,
  localityName: "Kings Heath",
  timezone: "Europe/London",
  now: new Date("2026-03-01T09:00:00Z"),
};

describe("the development fixture feed", () => {
  it("says plainly that it is a demonstration", () => {
    expect(FIXTURE_SOURCE_KEY).toBe("development-fixture-feed");
    expect(FIXTURE_LABEL).toContain("DEMONSTRATION");
  });

  it("travels the same road as a live provider payload", () => {
    const parsed = fixtureAdapter.parse(fixturePayload(request));
    expect(parsed.events.length).toBeGreaterThan(0);
    for (const event of parsed.events) {
      expect(event.title.trim()).not.toBe("");
      expect(Number.isNaN(Date.parse(event.startsAt))).toBe(false);
    }
  });

  it("puts the malformed and unusable records aside rather than importing them", () => {
    const parsed = fixtureAdapter.parse(fixturePayload(request));
    expect(parsed.skipped.length).toBeGreaterThan(0);
  });

  it("keeps no unsafe link on anything it does bring through", () => {
    const parsed = fixtureAdapter.parse(fixturePayload(request));
    for (const event of parsed.events) {
      const url = event.ticketUrl ?? "";
      if (url) expect(url.startsWith("http")).toBe(true);
    }
  });

  it("sits in the locality it was asked about, approximately", () => {
    const parsed = fixtureAdapter.parse(fixturePayload(request));
    const placed = parsed.events.filter((e) => e.lat !== null && e.lng !== null);
    expect(placed.length).toBeGreaterThan(0);
    for (const event of placed) {
      expect(Math.abs(Number(event.lat) - request.lat)).toBeLessThan(1);
      expect(Math.abs(Number(event.lng) - request.lng)).toBeLessThan(1);
    }
  });

  it("is deterministic for the same moment", () => {
    const a = fixtureAdapter.parse(fixturePayload(request)).events.map((e) => e.title);
    const b = fixtureAdapter.parse(fixturePayload(request)).events.map((e) => e.title);
    expect(a).toEqual(b);
  });
});
