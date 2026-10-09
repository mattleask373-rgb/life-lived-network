import { describe, expect, it } from "vitest";
import { evaluateLocalPageQuality } from "./local-page-quality";

describe("Local Page Quality Gate", () => {
  it("rejects non-canonical routes with NOINDEX", () => {
    const res = evaluateLocalPageQuality({
      isCanonicalRoute: false,
      hasResolvedLocality: true,
      realPossibilityCount: 5,
      realEventCount: 5,
      realNeedCount: 2,
      realCapabilityCount: 3,
      hasFreshData: true,
      hasMeaningfulUserAction: true,
    });
    expect(res.state).toBe("NOINDEX");
    expect(res.isIndexable).toBe(false);
  });

  it("rejects zero-inventory surfaces with NOINDEX", () => {
    const res = evaluateLocalPageQuality({
      isCanonicalRoute: true,
      hasResolvedLocality: true,
      realPossibilityCount: 0,
      realEventCount: 0,
      realNeedCount: 0,
      realCapabilityCount: 0,
      hasFreshData: true,
      hasMeaningfulUserAction: true,
    });
    expect(res.state).toBe("NOINDEX");
    expect(res.isIndexable).toBe(false);
  });

  it("flags stale evidence with STALE state", () => {
    const res = evaluateLocalPageQuality({
      isCanonicalRoute: true,
      hasResolvedLocality: true,
      realPossibilityCount: 4,
      realEventCount: 2,
      realNeedCount: 1,
      realCapabilityCount: 1,
      hasFreshData: false,
      hasMeaningfulUserAction: true,
    });
    expect(res.state).toBe("STALE");
    expect(res.isIndexable).toBe(false);
  });

  it("approves substantive, fresh, actionable surfaces as INDEXABLE", () => {
    const res = evaluateLocalPageQuality({
      isCanonicalRoute: true,
      hasResolvedLocality: true,
      realPossibilityCount: 4,
      realEventCount: 2,
      realNeedCount: 1,
      realCapabilityCount: 1,
      hasFreshData: true,
      hasMeaningfulUserAction: true,
    });
    expect(res.state).toBe("INDEXABLE");
    expect(res.isIndexable).toBe(true);
  });
});
