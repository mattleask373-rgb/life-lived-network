import { describe, expect, it } from "vitest";

import { journeyOverlaps, type JourneyContext } from "./journey-context";

const journey: JourneyContext = {
  id: "j1", ownerId: "p1", title: "A real trip", startsAt: "2026-09-23T08:00:00Z", endsAt: "2026-09-25T18:00:00Z", timezone: "Europe/London", visibility: "public", opportunityOptIn: true, status: "active", lastConfirmedAt: "2026-09-19T08:00:00Z", expiresAt: null, freshness: "fresh", places: [{ placeId: "scunthorpe", position: 1, arrivesAt: "2026-09-24T08:00:00Z", departsAt: "2026-09-24T18:00:00Z" }],
};

describe("journey context", () => {
  it("requires place and time overlap", () => {
    expect(journeyOverlaps(journey, "scunthorpe", "2026-09-24T10:00:00Z", "2026-09-24T12:00:00Z")).toBe(true);
    expect(journeyOverlaps(journey, "scunthorpe", "2026-09-26T10:00:00Z", null)).toBe(false);
  });

  it("never exposes private or non-opted-in journeys", () => {
    expect(journeyOverlaps({ ...journey, visibility: "private" }, "scunthorpe", null, null)).toBe(false);
    expect(journeyOverlaps({ ...journey, opportunityOptIn: false }, "scunthorpe", null, null)).toBe(false);
  });
});