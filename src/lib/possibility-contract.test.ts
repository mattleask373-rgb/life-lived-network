import { describe, expect, it } from "vitest";

import { openGardener, travellingGardener, gardenerNeed } from "./fixtures/supply";
import { findSupply } from "./supply-engine";
import {
  POSSIBILITY_CONTRACT_VERSION,
  toPossibilityContract,
  toPossibilityContracts,
} from "./possibility-contract";

describe("Possibility Contract", () => {
  it("uses the stable WHO → WHAT → WHERE → WHEN → WHY → UNKNOWN → ACTION shape", () => {
    const result = findSupply({ need: gardenerNeed, people: [openGardener], entries: [] }).results[0];
    expect(result).toBeDefined();

    const possibility = toPossibilityContract(result!);

    expect(possibility.contractVersion).toBe(POSSIBILITY_CONTRACT_VERSION);
    expect(possibility.who.kind).toBe("person");
    expect(possibility.who.id).toBe(openGardener.id);
    expect(possibility.what.band).toBe("open_to_opportunities");
    expect(possibility.where.relation).toBe("service_area");
    expect(possibility.when.evidence).toBe("unknown");
    expect(possibility.why.band).toBe("open_to_opportunities");
    expect(possibility.unknown).toContain("availability");
    expect(possibility.actions.map((action) => action.type)).toContain("contact");
  });

  it("keeps unknown availability explicit instead of turning it into a positive fact", () => {
    const result = findSupply({ need: gardenerNeed, people: [openGardener], entries: [] }).results[0]!;
    const possibility = toPossibilityContract(result);

    expect(possibility.when.label).toMatch(/Hasn't said when they're free/);
    expect(possibility.when.evidence).toBe("unknown");
    expect(possibility.unknown).toContain("availability");
    expect(possibility.why.facts.join(" ")).not.toMatch(/is available/i);
  });

  it("marks a journey as journey evidence, never live location", () => {
    const result = findSupply({
      need: gardenerNeed,
      people: [travellingGardener],
      entries: [],
    }).results.find((candidate) => candidate.band === "journey");

    expect(result).toBeDefined();
    const possibility = toPossibilityContract(result!);

    expect(possibility.where.relation).toBe("journey");
    expect(possibility.when.evidence).toBe("known");
    expect(possibility.why.band).toBe("journey");
    expect(possibility.caveat).toMatch(/not their live location/i);
  });

  it("does not expose raw person data or create a second matcher", () => {
    expect(toPossibilityContracts([])).toEqual([]);
    expect(toPossibilityContract).toHaveLength(1);
  });

  it("preserves engine order", () => {
    const results = findSupply({
      need: gardenerNeed,
      people: [openGardener, travellingGardener],
      entries: [],
    }).results;

    const possibilities = toPossibilityContracts(results);
    expect(possibilities.map((item) => item.id)).toEqual(results.map((item) => item.id));
  });
});
