import { describe, expect, it } from "vitest";
import { excludeBlocked } from "./block-filter";

describe("excludeBlocked", () => {
  it("removes people either side of a block", () => {
    const out = excludeBlocked(
      ["a", "b", "c"],
      "me",
      [
        { blocker_id: "me", blocked_id: "a" },
        { blocker_id: "b", blocked_id: "me" },
      ],
      false,
    );
    expect([...out]).toEqual(["c"]);
  });
  it("ignores blocks that do not involve the creator", () => {
    const out = excludeBlocked(["a"], "me", [{ blocker_id: "x", blocked_id: "a" }], false);
    expect([...out]).toEqual(["a"]);
  });
  it("returns nobody when the block list could not be read", () => {
    expect(excludeBlocked(["a", "b"], "me", null, true).size).toBe(0);
  });
});
