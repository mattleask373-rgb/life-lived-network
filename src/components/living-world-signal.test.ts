import { describe, expect, it } from "vitest";
import { determineActivityTone } from "./living-world-signal";

describe("Living World activity signal tone classification", () => {
  it("classifies zero records as quiet", () => {
    expect(determineActivityTone(0)).toBe("quiet");
    expect(determineActivityTone(0, true)).toBe("quiet");
  });

  it("classifies sparse activity when 1 or 2 items exist and none are live", () => {
    expect(determineActivityTone(1, false)).toBe("sparse");
    expect(determineActivityTone(2, false)).toBe("sparse");
  });

  it("classifies happening_now when active items are currently live", () => {
    expect(determineActivityTone(1, true)).toBe("happening_now");
    expect(determineActivityTone(5, true)).toBe("happening_now");
  });

  it("classifies upcoming when more than 2 items exist and none are currently live", () => {
    expect(determineActivityTone(3, false)).toBe("upcoming");
    expect(determineActivityTone(15, false)).toBe("upcoming");
  });

  it("is deterministic and pure", () => {
    for (let i = 0; i < 10; i++) {
      expect(determineActivityTone(0)).toBe("quiet");
      expect(determineActivityTone(1, true)).toBe("happening_now");
      expect(determineActivityTone(2, false)).toBe("sparse");
      expect(determineActivityTone(4, false)).toBe("upcoming");
    }
  });
});
