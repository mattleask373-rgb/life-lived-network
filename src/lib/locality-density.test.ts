import { describe, expect, it } from "vitest";
import { classifyLocalityDensity, getLocalityDensityConfig } from "./locality-density";

describe("locality density classification (presentation only)", () => {
  it("classifies 0 or negative records as quiet", () => {
    expect(classifyLocalityDensity(0)).toBe("quiet");
    expect(classifyLocalityDensity(-1)).toBe("quiet");

    const config = getLocalityDensityConfig(0);
    expect(config.density).toBe("quiet");
    expect(config.showLayerFilter).toBe(false);
    expect(config.promoteSignal).toBe(true);
    expect(config.mapHeightClass).toContain("h-44");
  });

  it("classifies 1 and 2 records as sparse with reduced mobile map height", () => {
    expect(classifyLocalityDensity(1)).toBe("sparse");
    expect(classifyLocalityDensity(2)).toBe("sparse");

    const configSingle = getLocalityDensityConfig(1, 1);
    expect(configSingle.density).toBe("sparse");
    expect(configSingle.showLayerFilter).toBe(false); // only 1 layer present, don't show noisy filter
    expect(configSingle.promoteSignal).toBe(true);
    expect(configSingle.mapHeightClass).toContain("h-48");

    const configMulti = getLocalityDensityConfig(2, 2);
    expect(configMulti.density).toBe("sparse");
    expect(configMulti.showLayerFilter).toBe(true);
  });

  it("classifies 3 to 5 records as medium with balanced map height", () => {
    expect(classifyLocalityDensity(3)).toBe("medium");
    expect(classifyLocalityDensity(4)).toBe("medium");
    expect(classifyLocalityDensity(5)).toBe("medium");

    const config = getLocalityDensityConfig(4, 2);
    expect(config.density).toBe("medium");
    expect(config.promoteSignal).toBe(false);
    expect(config.mapHeightClass).toContain("h-64");
  });

  it("classifies 6 or more records as dense with hero map height", () => {
    expect(classifyLocalityDensity(6)).toBe("dense");
    expect(classifyLocalityDensity(50)).toBe("dense");

    const config = getLocalityDensityConfig(12, 4);
    expect(config.density).toBe("dense");
    expect(config.promoteSignal).toBe(false);
    expect(config.showLayerFilter).toBe(true);
    expect(config.mapHeightClass).toContain("h-[54vh]");
  });

  it("is pure and deterministic", () => {
    for (let i = 0; i < 10; i++) {
      expect(classifyLocalityDensity(0)).toBe("quiet");
      expect(classifyLocalityDensity(2)).toBe("sparse");
      expect(classifyLocalityDensity(5)).toBe("medium");
      expect(classifyLocalityDensity(8)).toBe("dense");
    }
  });
});
