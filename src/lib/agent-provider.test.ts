import { describe, expect, it } from "vitest";

import {
  EXAMPLE_PROVIDER_DESCRIPTORS,
  isEligibleProvider,
  selectProvider,
  type ProviderSelectionPolicy,
} from "./agent-provider";

const defaultPolicy: ProviderSelectionPolicy = {
  preferIndependentReviewer: true,
  requireHumanFor: ["P0"],
  excludeProviders: [],
};

describe("provider registry policy", () => {
  it("marks a standard provider eligible for L1 product research", () => {
    const result = isEligibleProvider(
      EXAMPLE_PROVIDER_DESCRIPTORS.find((p) => p.id === "grok")!,
      { autonomy: "L1", risk: "P3", lane: "PRODUCT" },
      defaultPolicy,
    );
    expect(result.eligible).toBe(true);
  });

  it("rejects a provider that lacks required lane capability", () => {
    const plane = EXAMPLE_PROVIDER_DESCRIPTORS.find((p) => p.id === "plane_ai")!;
    const result = isEligibleProvider(
      plane,
      { autonomy: "L1", risk: "P3", lane: "SECURITY" },
      defaultPolicy,
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/lacks required capability/);
  });

  it("rejects providers exceeding task autonomy", () => {
    const plane = EXAMPLE_PROVIDER_DESCRIPTORS.find((p) => p.id === "plane_ai")!;
    const result = isEligibleProvider(
      plane,
      { autonomy: "L3", risk: "P3", lane: "IMPLEMENTATION" },
      defaultPolicy,
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/exceeds provider max/);
  });

  it("requires human for P0 when policy says so", () => {
    const result = isEligibleProvider(
      EXAMPLE_PROVIDER_DESCRIPTORS.find((p) => p.id === "grok")!,
      { autonomy: "L1", risk: "P0", lane: "IMPLEMENTATION" },
      defaultPolicy,
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/requires human gate/);
  });

  it("selects an eligible non-human provider for ordinary work", () => {
    const selected = selectProvider(
      EXAMPLE_PROVIDER_DESCRIPTORS,
      { autonomy: "L1", risk: "P3", lane: "IMPLEMENTATION" },
      defaultPolicy,
    );
    expect(selected).not.toBeNull();
    expect(selected!.id).not.toBe("human");
  });

  it("returns null when no provider is eligible", () => {
    const selected = selectProvider(
      EXAMPLE_PROVIDER_DESCRIPTORS.filter((p) => p.id !== "human"),
      { autonomy: "L4", risk: "P0", lane: "ARCHITECTURE" },
      { ...defaultPolicy, requireHumanFor: ["P0", "P1"] },
    );
    expect(selected).toBeNull();
  });

  it("prefers preferred reliability then lower cost", () => {
    // human is preferred reliability but highest cost; for non-P0 L1
    // a standard/medium provider should win over human.
    const selected = selectProvider(
      EXAMPLE_PROVIDER_DESCRIPTORS,
      { autonomy: "L1", risk: "P3", lane: "PRODUCT" },
      defaultPolicy,
    );
    expect(selected).not.toBeNull();
    expect(selected!.id).not.toBe("human");
    expect(selected!.reliabilityClass).toBe("standard");
  });
});
