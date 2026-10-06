import { describe, expect, it } from "vitest";

import { classifyPossibilityIntent, FRONT_DOOR_ACTIONS } from "./possibility-intent";

describe("possibility intent classifier", () => {
  it("routes need statements to /need", () => {
    const r = classifyPossibilityIntent("I need a gardener");
    expect(r.kind).toBe("NEED");
    expect(r.href).toBe("/need");
    expect(r.certainty).not.toBe("unclear");
  });

  it("routes help statements to /help", () => {
    const r = classifyPossibilityIntent("I can help with gardening");
    expect(r.kind).toBe("HELP");
    expect(r.href).toBe("/help");
  });

  it("routes volunteer / give to /give", () => {
    const r = classifyPossibilityIntent("I want to volunteer");
    expect(r.kind).toBe("GIVE");
    expect(r.href).toBe("/give");
  });

  it("routes travelling statements to /journey", () => {
    const r = classifyPossibilityIntent("I'm travelling through Bristol next week");
    expect(r.kind).toBe("JOURNEY");
    expect(r.href).toBe("/journey");
    expect(r.blurb).toMatch(/not your live location/i);
  });

  it("does not invent skill, place, or qualification from the sentence", () => {
    const r = classifyPossibilityIntent("I need help with wiring");
    expect(r.kind).toBe("NEED");
    expect(JSON.stringify(r)).not.toMatch(/electrician|qualified|qualification/i);
  });

  it("returns DISCOVER for empty or opaque text", () => {
    expect(classifyPossibilityIntent("").kind).toBe("DISCOVER");
    expect(classifyPossibilityIntent("hello").kind).toBe("DISCOVER");
  });

  it("is deterministic", () => {
    const a = classifyPossibilityIntent("I need someone to help me move a sofa");
    const b = classifyPossibilityIntent("I need someone to help me move a sofa");
    expect(a).toEqual(b);
  });

  it("exposes four front-door actions with existing paths only", () => {
    expect(FRONT_DOOR_ACTIONS).toHaveLength(4);
    const hrefs = FRONT_DOOR_ACTIONS.map((a) => a.href);
    expect(hrefs).toEqual(["/need", "/help", "/give", "/journey"]);
  });
});
