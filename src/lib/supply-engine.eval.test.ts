import { describe, expect, it } from "vitest";

import {
  gardenerNeed,
  latentGardener,
  openGardener,
  passingThroughOnly,
  travellingGardener,
  PLACE_KINGS_HEATH,
} from "./fixtures/supply";
import { findSupply, type PersonCandidate } from "./supply-engine";

const current = "2026-09-19T10:00:00.000Z";

describe("P1-B adversarial supply-engine evaluation", () => {
  it("does not infer willingness from capability", () => {
    const answer = findSupply({
      need: gardenerNeed,
      people: [latentGardener],
      entries: [],
      now: current,
    });

    expect(answer.results.map((result) => result.band)).toEqual(["local_capability"]);
    expect(answer.results[0]?.evidence?.unknown).toContain("opportunity preference");
    expect(answer.results.some((result) => result.band === "open_to_opportunities")).toBe(false);
  });

  it("does not infer availability from capability", () => {
    const answer = findSupply({
      need: gardenerNeed,
      people: [latentGardener],
      entries: [],
      now: current,
    });

    expect(answer.results[0]?.when).toMatch(/Nothing said about availability/);
    expect(answer.results[0]?.evidence?.unknown).toContain("availability");
  });

  it("does not turn an unavailable opted-in person into a fixed-time match", () => {
    const unavailable: PersonCandidate = {
      ...openGardener,
      id: "unavailable-fixed-time",
      availability: [
        {
          startsAt: "2026-09-25T08:00:00.000Z",
          endsAt: "2026-09-25T18:00:00.000Z",
        },
      ],
    };

    const answer = findSupply({
      need: { ...gardenerNeed, flexibility: "fixed" },
      people: [unavailable],
      entries: [],
      now: current,
    });

    expect(answer.results).toEqual([]);
    expect(answer.diagnostics.excludedByTime).toBe(1);
  });

  it("does not infer a journey from a selected passing-through place", () => {
    const answer = findSupply({
      need: gardenerNeed,
      people: [passingThroughOnly],
      entries: [],
      now: current,
    });

    expect(answer.results.some((result) => result.band === "journey")).toBe(false);
  });

  it("requires explicit journey evidence rather than residence or generic travel opt-in", () => {
    const noJourney: PersonCandidate = {
      ...travellingGardener,
      id: "travel-opt-in-without-journey",
      placeId: PLACE_KINGS_HEATH,
      placeName: "Kings Heath",
      journeys: [],
    };

    const answer = findSupply({
      need: gardenerNeed,
      people: [noJourney],
      entries: [],
      now: current,
    });

    expect(answer.results.some((result) => result.band === "journey")).toBe(false);
  });

  it("does not treat living in the requested place as proof of serving it", () => {
    const residentOnly: PersonCandidate = {
      ...latentGardener,
      id: "resident-without-service-area",
      placeId: PLACE_KINGS_HEATH,
      serviceAreaPlaceIds: [],
    };

    const answer = findSupply({
      need: gardenerNeed,
      people: [residentOnly],
      entries: [],
      now: current,
    });

    expect(answer.results).toEqual([]);
  });

  it("does not surface a private capability", () => {
    const privateCapability: PersonCandidate = {
      ...openGardener,
      id: "private-capability",
      capabilities: openGardener.capabilities.map((capability) => ({
        ...capability,
        visibility: "private",
      })),
    };

    const answer = findSupply({
      need: gardenerNeed,
      people: [privateCapability],
      entries: [],
      now: current,
    });

    expect(answer.results).toEqual([]);
  });

  it("does not surface an expired capability", () => {
    const expired: PersonCandidate = {
      ...openGardener,
      id: "expired-capability",
      capabilities: openGardener.capabilities.map((capability) => ({
        ...capability,
        expiresOn: "2026-09-18T23:59:59.000Z",
      })),
    };

    const answer = findSupply({
      need: gardenerNeed,
      people: [expired],
      entries: [],
      now: current,
    });

    expect(answer.results).toEqual([]);
    expect(answer.diagnostics.excludedByFreshness).toBe(1);
  });

  it("does not satisfy a required qualification with a mere skill", () => {
    const skillOnly: PersonCandidate = {
      ...openGardener,
      id: "skill-not-qualification",
      capabilities: openGardener.capabilities.map((capability) => ({
        ...capability,
        kind: "skill",
        label: "horticulture licence",
      })),
    };

    const answer = findSupply({
      need: {
        ...gardenerNeed,
        requiredQualifications: ["horticulture licence"],
      },
      people: [skillOnly],
      entries: [],
      now: current,
    });

    expect(answer.results).toEqual([]);
    expect(answer.diagnostics.excludedByQualification).toBe(1);
  });

  it("keeps reported and expired people out even when all other evidence is strong", () => {
    const reported = { ...openGardener, id: "reported", discoveryStatus: "REPORTED" as const };
    const expired = { ...openGardener, id: "expired-person", discoveryStatus: "EXPIRED" as const };

    const answer = findSupply({
      need: gardenerNeed,
      people: [reported, expired],
      entries: [],
      now: current,
    });

    expect(answer.results).toEqual([]);
    expect(answer.diagnostics.excludedByStatus).toBe(2);
  });

  it("does not turn missing willingness into positive opportunity evidence", () => {
    const unknownWillingness: PersonCandidate = {
      ...openGardener,
      id: "unknown-willingness",
      preferences: [],
    };

    const answer = findSupply({
      need: gardenerNeed,
      people: [unknownWillingness],
      entries: [],
      now: current,
    });

    expect(answer.results).toHaveLength(1);
    expect(answer.results[0]?.band).toBe("local_capability");
    expect(answer.results[0]?.evidence?.unknown).toContain("opportunity preference");
  });

  it("returns a quiet result when no truthful evidence supports a match", () => {
    const answer = findSupply({
      need: { ...gardenerNeed, category: "underwater welding", requiredSkills: ["underwater welding"] },
      people: [latentGardener],
      entries: [],
      now: current,
    });

    expect(answer.quiet).toBe(true);
    expect(answer.results).toEqual([]);
  });

  it("is deterministic for identical adversarial input", () => {
    const input = {
      need: gardenerNeed,
      people: [openGardener, latentGardener, travellingGardener],
      entries: [],
      now: current,
    };

    expect(findSupply(input)).toEqual(findSupply(input));
  });

  it("requires journey visibility and opt-in as part of journey evidence", () => {
    const nonPublicOptOut: PersonCandidate = {
      ...travellingGardener,
      id: "journey-not-discoverable",
      journeys: (travellingGardener.journeys ?? []).map((journey) => ({
        ...journey,
        visibility: "private" as const,
        opportunityOptIn: false,
      })),
    };

    const answer = findSupply({
      need: gardenerNeed,
      people: [nonPublicOptOut],
      entries: [],
      now: current,
    });

    expect(answer.results.some((result) => result.band === "journey")).toBe(false);
  });
});
