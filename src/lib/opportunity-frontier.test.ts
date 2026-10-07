import { describe, expect, it } from "vitest";

import {
  classifySupplyState,
  observeFrontier,
  validateFrontierObservation,
} from "./opportunity-frontier";

describe("opportunity-frontier", () => {
  it("classifies empty and sparse without inventing supply", () => {
    expect(
      classifySupplyState({
        resultsCount: 0,
        bandsSearched: ["direct"],
        diagnostics: {},
      }),
    ).toBe("empty");
    expect(
      classifySupplyState({
        resultsCount: 2,
        bandsSearched: ["direct"],
        diagnostics: {},
      }),
    ).toBe("sparse");
  });

  it("marks empty supply as a model gap, not real-world emptiness", () => {
    const obs = observeFrontier({
      id: "f1",
      scope: "gb/birmingham/kings-heath",
      supply: { resultsCount: 0, bandsSearched: ["direct"], diagnostics: {} },
    });
    expect(obs.supplyState).toBe("empty");
    expect(obs.structuralGap).toMatch(/not proof of absence/i);
    expect(obs.epistemic).toBe("UNKNOWN");
    expect(validateFrontierObservation(obs).valid).toBe(true);
  });

  it("rejects REAL classification for empty supply as a world claim", () => {
    const obs = observeFrontier({
      id: "f2",
      scope: "gb/test",
      supply: { resultsCount: 0, bandsSearched: [], diagnostics: {} },
    });
    obs.epistemic = "REAL";
    expect(validateFrontierObservation(obs).valid).toBe(false);
  });

  it("surfaces stale ingest without inventing demand", () => {
    const obs = observeFrontier({
      id: "f3",
      scope: "gb/test",
      supply: {
        resultsCount: 1,
        bandsSearched: ["direct"],
        diagnostics: { excludedByFreshness: 3 },
      },
      ingest: [
        {
          sourceId: "fixture-a",
          freshness: "stale",
          recordsSeen: 10,
          provenancePresent: true,
        },
      ],
    });
    expect(obs.unknowns.some((u) => u.includes("stale"))).toBe(true);
    expect(obs.unknowns.some((u) => u.includes("excluded"))).toBe(true);
  });

  it("requires human gate for irreversible high-risk observations", () => {
    const obs = observeFrontier({
      id: "f4",
      scope: "gb/test",
      supply: { resultsCount: 5, bandsSearched: ["direct"], diagnostics: {} },
    });
    obs.risk = "critical";
    obs.reversible = false;
    obs.requiresHumanGate = false;
    expect(validateFrontierObservation(obs).valid).toBe(false);
  });
});
