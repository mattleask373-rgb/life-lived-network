import { describe, expect, it } from "vitest";

import {
  cleanerNeed,
  communityGardenEntry,
  contributionNeed,
  farAwayGardener,
  freeHelpEntry,
  gardenerNeed,
  gardenerOfferEntry,
  latentGardener,
  openGardener,
  swappingGardener,
  travellingGardener,
  unrelatedEntry,
} from "./fixtures/supply";
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
    const answer = findSupply({ need: cleanerNeed, people: [latentGardener], entries: [unrelatedEntry] });
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
});
