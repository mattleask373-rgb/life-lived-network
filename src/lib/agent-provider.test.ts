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
  it("selects a standard coding provider for L2/P2 implementation", () => {
    const selected = selectProvider(
      EXAMPLE_PROVIDER_DESCRIPTORS,
      { autonomy: "L2", risk: "P2", lane: "IMPLEMENTATION" },
      defaultPolicy,
    );
    expect(selected).not.toBeNull();
    expect(["grok", "openai", "plane_ai", "human"]).toContain(selected!.id);
  });

  it("requires human for P0 when policy says so", () => {
    const humanOnly = isEligibleProvider(
      EXAMPLE_PROVIDER_DESCRIPTORS.find((p) => p.id === "human")!,
      { autonomy: "L2", risk: "P0", lane: "SECURITY" },
      defaultPolicy,
    );
    expect(humanOnly.eligible).toBe(true);

    const grok = isEligibleProvider(
      EXAMPLE_PROVIDER_DESCRIPTORS.find((p) => p.id === "grok")!,
      { autonomy: "L2", risk: "P0", lane: "SECURITY" },
      defaultPolicy,
    );
    expect(grok.eligible).toBe(false);
    expect(grok.reason).toMatch(/human gate/);
  });


  it("rejects a provider that lacks the lane capability", () => {
    const provider = {
      ...EXAMPLE_PROVIDER_DESCRIPTORS.find((p) => p.id === "plane_ai")!,
      capabilities: ["research"] as const,
    };
    const decision = isEligibleProvider(
      provider,
      { autonomy: "L2", risk: "P2", lane: "IMPLEMENTATION" },
      defaultPolicy,
    );
    expect(decision.eligible).toBe(false);
    expect(decision.reason).toMatch(/lacks required capability implementation/);
  });

  it("requires the actual human provider for a human-gated risk", () => {
    const disguised = {
      ...EXAMPLE_PROVIDER_DESCRIPTORS.find((p) => p.id === "grok")!,
      id: "trusted-non-human",
      maxRiskWithoutHumanGate: "P0" as const,
    };
    const decision = isEligibleProvider(
      disguised,
      { autonomy: "L2", risk: "P0", lane: "REVIEW" },
      defaultPolicy,
    );
    expect(decision.eligible).toBe(false);
    expect(decision.reason).toMatch(/not the human provider/);
  });

  it("excludes providers listed in policy", () => {
    const selected = selectProvider(
      EXAMPLE_PROVIDER_DESCRIPTORS,
      { autonomy: "L1", risk: "P3", lane: "PRODUCT" },
      { ...defaultPolicy, excludeProviders: ["plane_ai", "openai", "grok"] },
    );
    expect(selected?.id).toBe("human");
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
