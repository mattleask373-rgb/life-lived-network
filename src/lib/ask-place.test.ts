import { describe, expect, it } from "vitest";

import { askPlaceState, ASK_PLACE_GATES } from "./ask-place";

describe("askPlaceState", () => {
  it("is unavailable until a grounded server contract exists", () => {
    expect(askPlaceState().status).toBe("unavailable");
  });

  it("never carries an answer", () => {
    expect(Object.keys(askPlaceState()).sort()).toEqual(["gates", "reason", "status"]);
  });

  it("lists the findSupply grounding gate", () => {
    expect(ASK_PLACE_GATES.some((g) => g.includes("findSupply()"))).toBe(true);
  });
});
