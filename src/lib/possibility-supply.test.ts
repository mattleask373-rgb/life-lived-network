import { describe, expect, it } from "vitest";

import { gardenerNeed, openGardener } from "./fixtures/supply";
import { findSupply, whatElse, whoCouldMakeThisHappen } from "./supply-engine";

describe("possibility supply contract", () => {
  it("keeps who-could results to real people", () => {
    const answer = whoCouldMakeThisHappen({ need: gardenerNeed, people: [openGardener], entries: [] });
    expect(answer.results.every((result) => Boolean(result.personId))).toBe(true);
  });

  it("what else omits direct supply", () => {
    const answer = whatElse({ need: gardenerNeed, people: [openGardener], entries: [] });
    expect(answer.results.every((result) => result.supplyType !== "DIRECT")).toBe(true);
  });

  it("keeps availability unknown when it was never stated", () => {
    const answer = findSupply({ need: gardenerNeed, people: [{ ...openGardener, availability: [] }], entries: [] });
    expect(answer.results[0]?.constraints.some((constraint) => constraint.kind === "availability" && constraint.state === "unknown")).toBe(true);
  });
});