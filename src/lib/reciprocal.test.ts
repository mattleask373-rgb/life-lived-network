import { describe, expect, it } from "vitest";

import { findOpportunitiesForPerson } from "./reciprocal";
import {
  ALEX,
  BRIGHTON_CHANGEOVER_NEED,
  BRISTOL_CLEANING_NEED,
  COMMUNITY_GARDEN_NEED,
  DANIEL,
  FIXTURE_NEEDS,
  FIXTURE_NOW,
  MARIA,
  PRIVATE_NEED,
  SARAH,
  STALE,
  SWAP_NEED,
  THERAPY_NEED,
} from "./fixtures/people-and-needs";

const now = FIXTURE_NOW;

describe("what could this person help with", () => {
  it("finds an exact match when skill, place and time all line up", () => {
    const found = findOpportunitiesForPerson({ person: SARAH, needs: FIXTURE_NEEDS, now });
    const exact = found.find((f) => f.need.id === BRIGHTON_CHANGEOVER_NEED.id);
    expect(exact?.kind).toBe("exact_match");
    expect(exact?.why).toContain("A time you said you're free overlaps theirs");
  });

  it("does not offer work in a place the person never said they'd go", () => {
    const found = findOpportunitiesForPerson({ person: SARAH, needs: FIXTURE_NEEDS, now });
    expect(found.map((f) => f.need.id)).not.toContain(BRISTOL_CLEANING_NEED.id);
  });

  it("never surfaces someone's private note to themselves", () => {
    const found = findOpportunitiesForPerson({ person: SARAH, needs: FIXTURE_NEEDS, now });
    expect(found.map((f) => f.need.id)).not.toContain(PRIVATE_NEED.id);
  });

  it("labels a community project as a community possibility", () => {
    const found = findOpportunitiesForPerson({ person: ALEX, needs: FIXTURE_NEEDS, now });
    const garden = found.find((f) => f.need.id === COMMUNITY_GARDEN_NEED.id);
    expect(garden?.kind).toBe("community_possibility");
    expect(garden?.caveat).toMatch(/community-run/i);
  });

  it("calls a swap a swap, and only where the person said they'd be", () => {
    const found = findOpportunitiesForPerson({ person: DANIEL, needs: FIXTURE_NEEDS, now });
    const swap = found.find((f) => f.need.id === SWAP_NEED.id);
    expect(swap?.kind).toBe("swap");
    expect(swap?.why.join(" ")).toMatch(/swap/i);
  });

  it("only counts travelling when a journey was actually shared", () => {
    const away = { ...DANIEL, placeId: "place-lisbon", serviceAreaPlaceIds: [] };
    expect(
      findOpportunitiesForPerson({ person: away, needs: [COMMUNITY_GARDEN_NEED], now }),
    ).toEqual([]);

    const withJourney = {
      ...away,
      journeys: [
        {
          id: "j1",
          ownerId: away.id,
          title: "Trip",
          startsAt: "2026-03-11T08:00:00.000Z",
          endsAt: "2026-03-13T20:00:00.000Z",
          timezone: "Europe/London",
          visibility: "public" as const,
          opportunityOptIn: true,
          status: "active" as const,
          lastConfirmedAt: now,
          expiresAt: null,
          freshness: "fresh" as const,
          places: [
            {
              placeId: COMMUNITY_GARDEN_NEED.placeId!,
              position: 0,
              arrivesAt: null,
              departsAt: null,
            },
          ],
        },
      ],
    };
    const found = findOpportunitiesForPerson({
      person: withJourney,
      needs: [COMMUNITY_GARDEN_NEED],
      now,
    });
    expect(found[0]?.kind).toBe("travelling_possibility");
  });

  it("ignores statements that are out of date", () => {
    expect(findOpportunitiesForPerson({ person: STALE, needs: FIXTURE_NEEDS, now })).toEqual([]);
  });

  it("flags regulated work rather than implying permission", () => {
    const found = findOpportunitiesForPerson({ person: MARIA, needs: FIXTURE_NEEDS, now });
    const therapy = found.find((f) => f.need.id === THERAPY_NEED.id);
    expect(therapy).toBeTruthy();
    expect(therapy?.notes.join(" ")).toMatch(/regulated/i);
  });

  it("is deterministic", () => {
    const a = findOpportunitiesForPerson({ person: ALEX, needs: FIXTURE_NEEDS, now });
    const b = findOpportunitiesForPerson({ person: ALEX, needs: FIXTURE_NEEDS, now });
    expect(a).toEqual(b);
  });
});
