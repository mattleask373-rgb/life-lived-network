import { describe, expect, it } from "vitest";

import { isRegulated, regulatedFlags } from "./policy";

describe("regulated things", () => {
  it("flags therapy without deciding anything about the person", () => {
    const flags = regulatedFlags("Looking for counselling in Lisbon");
    expect(flags).toHaveLength(1);
    expect(flags[0]?.area).toBe("mental_health");
    expect(flags[0]?.note).toMatch(/registered/i);
  });

  it("flags gas and electrical work", () => {
    expect(isRegulated("boiler service")).toBe(true);
    expect(isRegulated("rewire the kitchen")).toBe(true);
  });

  it("leaves ordinary things alone", () => {
    expect(isRegulated("help me move a sofa")).toBe(false);
    expect(regulatedFlags("gardening on Thursday")).toEqual([]);
  });
});
