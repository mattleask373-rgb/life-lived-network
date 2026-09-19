import { describe, expect, it } from "vitest";

import {
  cleanerNeed,
  communityGardenEntry,
  contributionNeed,
  farAwayGardener,
  freeHelpEntry,
  gardenerNeed,
  gardenerOfferEntry,
  gardeningWorkshopEntry,
  latentGardener,
  openGardener,
  swappingGardener,
  travellingGardener,
  publicJourneyGardener,
  privateJourneyGardener,
  unrelatedEntry,
  passingThroughOnly,
  PLACE_BIRMINGHAM,
  PLACE_KINGS_HEATH,
} from "./fixtures/supply";
import { buildPlaceIndex } from "./places";
import { needGeography } from "./geo-scope";
import { BAND_ORDER, findSupply, type SupplyBand } from "./supply-engine";

const bands = (results: { band: SupplyBand }[]) => results.map((r) => r.band);

describe("supply engine", () => {
  it("returns a direct offer when someone has actually posted one", () => {
    const answer = findSupply({ need: gardenerNeed, people: [], entries: [gardenerOfferEntry] });
    expect(bands(answer.results)).toContain("direct");
    expect(answer.quiet).toBe(false);
  });

  it("keeps a bare capability out of the availability band", () => {
    const answer = findSupply({ need: gardenerNeed, people: [latentGardener], entries: [] });
    expect(bands(answer.results)).toEqual(["local_capability"]);
    expect(answer.results[0]?.when).toMatch(/Nothing said/);
  });

  it("puts someone who opted in, and is free, in the right band", () => {
    const answer = findSupply({ need: gardenerNeed, people: [openGardener], entries: [] });
    expect(bands(answer.results)).toEqual(["open_to_opportunities"]);
    expect(answer.results[0]?.why.join(" ")).toMatch(/availability window/);
  });

  it("never treats a journey as availability", () => {
    const answer = findSupply({ need: gardenerNeed, people: [travellingGardener], entries: [] });
    expect(bands(answer.results)).toContain("journey");
    const journey = answer.results.find((r) => r.band === "journey");
    expect(journey?.caveat).toMatch(/not their live location/);
  });

  it("requires public opted-in journey dates to overlap", () => {
    const answer = findSupply({
      need: gardenerNeed,
      people: [publicJourneyGardener, privateJourneyGardener],
      entries: [],
    });
    expect(answer.results.filter((result) => result.supplyType === "JOURNEY")).toHaveLength(1);
    expect(
      answer.results
        .find((result) => result.supplyType === "JOURNEY")
        ?.signals.map((signal) => signal.reason),
    ).toContain("journey time overlap");
  });

  it("suppresses reviewed-reported supply", () => {
    const answer = findSupply({
      need: gardenerNeed,
      people: [{ ...openGardener, discoveryStatus: "REPORTED" }],
      entries: [],
    });
    expect(answer.results).toHaveLength(0);
    expect(answer.diagnostics.excludedByStatus).toBe(1);
  });

  it("offers a genuinely related possibility in what else", () => {
    const answer = findSupply({
      need: gardenerNeed,
      people: [],
      entries: [gardeningWorkshopEntry],
    });
    expect(answer.results.map((result) => result.supplyType)).toContain("RELATED");
  });

  it("returns canonical explainable metadata", () => {
    const result = findSupply({ need: gardenerNeed, people: [openGardener], entries: [] })
      .results[0];
    expect(result?.supplyType).toBe("LATENT");
    expect(result?.confidence.basis.length).toBeGreaterThan(0);
    expect(result?.trust.verification).toBe("self_stated");
    expect(result?.provenance.origin).toBe("person");
  });

  it("offers a swap only when the person said they'd swap", () => {
    const answer = findSupply({ need: gardenerNeed, people: [swappingGardener], entries: [] });
    expect(bands(answer.results)).toContain("skills_exchange");
  });

  it("finds community and freely-offered help for a contribution need", () => {
    const answer = findSupply({
      need: contributionNeed,
      people: [],
      entries: [communityGardenEntry, freeHelpEntry],
    });
    expect(bands(answer.results)).toContain("community");
    expect(bands(answer.results)).toContain("contribution");
  });

  it("ignores people outside the place", () => {
    const answer = findSupply({ need: gardenerNeed, people: [farAwayGardener], entries: [] });
    expect(answer.results.filter((r) => r.band !== "journey")).toHaveLength(0);
  });

  it("goes quiet rather than inventing", () => {
    const answer = findSupply({
      need: cleanerNeed,
      people: [latentGardener],
      entries: [unrelatedEntry],
    });
    expect(answer.results).toHaveLength(0);
    expect(answer.quiet).toBe(true);
  });

  it("returns bands in the fixed order", () => {
    const answer = findSupply({
      need: gardenerNeed,
      people: [latentGardener, openGardener, travellingGardener, swappingGardener],
      entries: [gardenerOfferEntry, communityGardenEntry, freeHelpEntry],
    });
    const seen = bands(answer.results);
    const positions = seen.map((b) => BAND_ORDER.indexOf(b));
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("is deterministic", () => {
    const input = {
      need: gardenerNeed,
      people: [openGardener, latentGardener],
      entries: [gardenerOfferEntry],
    };
    expect(findSupply(input)).toEqual(findSupply(input));
  });

  it("explains why stale and unqualified people were excluded", () => {
    const stale = {
      ...openGardener,
      id: "stale",
      capabilities: openGardener.capabilities.map((capability) => ({
        ...capability,
        lastConfirmedAt: "2020-01-01T00:00:00.000Z",
      })),
    };
    const answer = findSupply({
      need: { ...gardenerNeed, requiredQualifications: ["horticulture licence"] },
      people: [stale, openGardener],
      entries: [],
      now: "2026-09-19T10:00:00.000Z",
    });
    expect(answer.results).toHaveLength(0);
    expect(answer.diagnostics.excludedByFreshness).toBe(1);
    expect(answer.diagnostics.excludedByQualification).toBe(1);
  });
});

describe("real geography, not exact place ids", () => {
  const INDEX = buildPlaceIndex([
    {
      id: "uk",
      parent_id: null,
      kind: "country",
      name: "uk",
      slug: "uk",
      country_code: "GB",
      timezone: "Europe/London",
      currency: "GBP",
      lat: null,
      lng: null,
      blurb: "",
    },
    {
      id: PLACE_BIRMINGHAM,
      parent_id: "uk",
      kind: "city",
      name: "Birmingham",
      slug: "birmingham",
      country_code: "GB",
      timezone: "Europe/London",
      currency: "GBP",
      lat: null,
      lng: null,
      blurb: "",
    },
    {
      id: PLACE_KINGS_HEATH,
      parent_id: PLACE_BIRMINGHAM,
      kind: "neighbourhood",
      name: "King's Heath",
      slug: "kings-heath",
      country_code: "GB",
      timezone: "Europe/London",
      currency: "GBP",
      lat: null,
      lng: null,
      blurb: "",
    },
  ]);
  const geography = needGeography(INDEX, PLACE_KINGS_HEATH);

  it("includes someone who says they cover the whole city", () => {
    const cityWide = {
      ...openGardener,
      id: "city-wide",
      placeId: PLACE_BIRMINGHAM,
      serviceAreaPlaceIds: [PLACE_BIRMINGHAM],
    };
    const answer = findSupply({
      need: gardenerNeed,
      people: [cityWide],
      entries: [],
      geography,
    });
    expect(answer.results.length).toBe(1);
    expect(answer.results[0]?.why.join(" ")).toMatch(/area they said they cover/i);
  });

  it("does not assume someone living in the wider city works in the neighbourhood", () => {
    const merelyNearby = {
      ...openGardener,
      id: "merely-nearby",
      placeId: PLACE_BIRMINGHAM,
      serviceAreaPlaceIds: [],
    };
    const answer = findSupply({
      need: gardenerNeed,
      people: [merelyNearby],
      entries: [],
      geography,
    });
    expect(answer.results).toEqual([]);
  });

  it("never treats ticking a place as passing through as a journey", () => {
    const answer = findSupply({
      need: gardenerNeed,
      people: [passingThroughOnly],
      entries: [],
      geography,
    });
    expect(bands(answer.results)).not.toContain("journey");
  });
});
