import { describe, expect, it } from "vitest";
import { streamToExperimentPlan } from "./income-stream-experiment-adapter";
import type { IncomeStreamKit, StreamExperiment } from "./income-stream-kit";

const stream: IncomeStreamKit = {
  id: "provider-intelligence",
  industry: "professional services",
  customer: "small expert teams",
  problem: "market signals are fragmented",
  value: "verified intelligence packets",
  paymentMechanism: "subscription",
  autonomyCeiling: "L2",
  state: "EXPERIMENTAL",
  humanGates: ["human approves publication and outreach"],
  killCriteria: ["no verified signal", "no repeat value"],
  evidenceRequired: ["source evidence", "customer confirmation"],
  dependencies: ["provenance", "verification"],
};

const experiment: StreamExperiment = {
  streamId: stream.id,
  hypothesis: "A bounded intelligence packet is useful to a real customer.",
  smallestTest: "Draft one evidence-backed packet for human review.",
  successSignals: ["customer confirms usefulness"],
  failureSignals: ["unsupported or irrelevant"],
  budget: { money: 0, paidSpendAllowed: false },
  humanApprovalRequired: true,
};

describe("income stream experiment adapter", () => {
  it("produces a human-gated reversible experiment plan", () => {
    const plan = streamToExperimentPlan(stream, experiment);
    expect(plan.requiresHumanGate).toBe(true);
    expect(plan.reversible).toBe(true);
    expect(plan.failureCriteria).toContain("no repeat value");
  });

  it("rejects paid activity", () => {
    expect(() => streamToExperimentPlan(stream, {
      ...experiment,
      budget: { money: 0, paidSpendAllowed: true },
    })).toThrow("paid activity");
  });

  it("rejects an experiment that drops its human gate", () => {
    expect(() => streamToExperimentPlan(stream, {
      ...experiment,
      humanApprovalRequired: false,
    })).toThrow("human approval");
  });
});
