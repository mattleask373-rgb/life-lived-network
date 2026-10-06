import { describe, expect, it } from "vitest";
import { localPageQuality } from "./local-page-quality";

const good = {
  realPossibilityCount: 2, realNeedCount: 1, realCapabilityCount: 1, realCommunityCount: 0,
  hasUsefulGuideData: true, hasFreshData: true, hasMeaningfulAction: true, isCanonicalRoute: true,
};

describe("local discovery quality gate", () => {
  it("allows an evidence-backed canonical page", () => {
    expect(localPageQuality(good).state).toBe("INDEXABLE");
  });
  it("refuses a page with no real evidence", () => {
    expect(localPageQuality({
      ...good, realPossibilityCount: 0, realNeedCount: 0, realCapabilityCount: 0,
      realCommunityCount: 0, hasUsefulGuideData: false,
    }).state).toBe("NOINDEX");
  });
  it("requires freshness before indexability", () => {
    expect(localPageQuality({ ...good, hasFreshData: false }).state).toBe("READY_FOR_REVIEW");
  });
  it("requires a canonical route", () => {
    expect(localPageQuality({ ...good, isCanonicalRoute: false }).state).toBe("NOINDEX");
  });
});
