import { describe, expect, it } from "vitest";
import { emptyListState } from "./discovery-empty";

describe("emptyListState", () => {
  it("says filtered-out when a filter hides loaded entries", () => {
    expect(emptyListState(5, true)).toBe("filtered-out");
  });
  it("says nothing recorded when the place has no entries", () => {
    expect(emptyListState(0, true)).toBe("nothing-recorded");
    expect(emptyListState(0, false)).toBe("nothing-recorded");
  });
});
