import { describe, expect, it } from "vitest";
import { findSupply } from "./supply-engine";
import {
  gardenerNeed,
  latentGardener,
  openGardener,
  travellingGardener,
  PLACE_KINGS_HEATH,
  PLACE_BIRMINGHAM,
} from "./fixtures/supply";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Slice 2: Human Possibility → Connection Architecture & Invariants", () => {
  it("architectural invariant: need route does NOT import or call servicePossibilities", () => {
    const routeFile = fs.readFileSync(path.resolve(__dirname, "../routes/need.$id.tsx"), "utf-8");
    expect(routeFile).not.toContain("servicePossibilities");
    expect(routeFile).not.toContain("providerLine");
    expect(routeFile).not.toContain("getWorld");
  });

  it("canonical supply is the sole possibility authority producing PossibilitySupply contract", () => {
    const answer = findSupply({
      need: gardenerNeed,
      people: [openGardener],
      entries: [],
    });

    expect(answer.quiet).toBe(false);
    expect(answer.results.length).toBeGreaterThan(0);

    const first = answer.results[0];
    // WHO
    expect(first.title).toBe(openGardener.displayName);
    expect(first.personId).toBe(openGardener.id);
    // WHAT
    expect(first.what).toContain("gardening");
    // WHERE
    expect(first.where).toBe(openGardener.placeName);
    // WHEN
    expect(first.when).toContain("free");
    // WHY
    expect(first.why.length).toBeGreaterThan(0);
    // ACTIONS
    expect(first.actions).toContain("contact");
    expect(first.actions).toContain("view");
    // CONTRACT PROPERTIES
    expect(first.supplyType).toBe("LATENT");
    expect(first.status).toBe("ACTIVE");
    expect(first.confidence).toBeDefined();
    expect(first.trust).toBeDefined();
    expect(first.provenance).toBeDefined();
  });

  it("invariant: unknown availability remains plainly unknown and is never converted to yes", () => {
    const answer = findSupply({
      need: gardenerNeed,
      people: [latentGardener],
      entries: [],
    });

    expect(answer.results.length).toBe(1);
    const result = answer.results[0];
    expect(result.when).toMatch(/Nothing said|Hasn't said/);
    expect(result.evidence?.unknown).toContain("availability");
  });

  it("invariant: living in a place does not equal serving that place", () => {
    const residentOnly = {
      ...openGardener,
      id: "person-resident-only",
      placeId: PLACE_BIRMINGHAM,
      placeName: "Birmingham",
      serviceAreaPlaceIds: ["somewhere-else-in-bham"], // does NOT include PLACE_KINGS_HEATH
    };

    const answer = findSupply({
      need: gardenerNeed,
      people: [residentOnly],
      entries: [],
    });

    // Excluded by place constraint
    expect(answer.results).toHaveLength(0);
    expect(answer.quiet).toBe(true);
    expect(answer.diagnostics.excludedByPlace).toBeGreaterThanOrEqual(1);
  });

  it("invariant: honest quiet state when no trustworthy supply exists", () => {
    const answer = findSupply({
      need: gardenerNeed,
      people: [],
      entries: [],
    });

    expect(answer.quiet).toBe(true);
    expect(answer.results).toHaveLength(0);
  });

  it("invariant: reported candidates are suppressed from active supply", () => {
    const reportedCandidate = {
      ...openGardener,
      id: "person-reported",
      discoveryStatus: "REPORTED" as const,
    };

    const answer = findSupply({
      need: gardenerNeed,
      people: [reportedCandidate],
      entries: [],
    });

    expect(answer.results).toHaveLength(0);
    expect(answer.diagnostics.excludedByStatus).toBe(1);
  });

  it("invariant: journey evidence is never presented as live location", () => {
    const answer = findSupply({
      need: gardenerNeed,
      people: [travellingGardener],
      entries: [],
    });

    expect(answer.results.length).toBeGreaterThanOrEqual(1);
    const result = answer.results.find((r) => r.band === "journey");
    expect(result).toBeDefined();
    expect(result?.where).toContain("Passing through");
    expect(result?.where).not.toContain("Live location");
    expect(result?.where).not.toContain("Current GPS");
    expect(result?.caveat).toMatch(/not their live location/);
  });
});
