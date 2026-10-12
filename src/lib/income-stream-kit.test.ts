import { describe, expect, it } from "vitest";
import {
  canRunStreamExperiment,
  validateIncomeStreamKit,
  type IncomeStreamKit,
  type StreamExperiment,
} from "./income-stream-kit";

const stream: IncomeStreamKit = {
  id: "local-opportunity-leads",
  industry: "local services",
  customer: "small local operators",
  problem: "qualified demand is fragmented across local discovery surfaces",
  value: "truthful, evidence-backed opportunity discovery",
  paymentMechanism: "lead",
  autonomyCeiling: "L2",
  state: "EXPERIMENTAL",
  humanGates: ["human approves any external outreach or paid activity"],
  killCriteria: ["no qualified demand signal after bounded test", "evidence cannot support truthful customer value"],
  evidenceRequired: ["real customer demand", "real supply evidence", "measured conversion signal"],
  dependencies: ["canonical findSupply()", "provenance", "human-approved outreach"],
};

const experiment: StreamExperiment = {
  streamId: stream.id,
  hypothesis: "A bounded set of verified local opportunities can produce useful qualified leads.",
  smallestTest: "Create one draft opportunity packet and measure whether a human prospect confirms relevance.",
  successSignals: ["qualified response", "repeat demand", "measurable action"],
  failureSignals: ["no response", "low relevance", "unsupported claims"],
  budget: { money: 0, paidSpendAllowed: false },
  humanApprovalRequired: true,
};

describe("income stream kit", () => {
  it("requires bounded autonomy, gates, kill criteria and evidence", () => {
    expect(() => validateIncomeStreamKit(stream)).not.toThrow();
  });

  it("rejects experiments that spend money", () => {
    expect(canRunStreamExperiment(stream, {
      ...experiment,
      budget: { money: 1, paidSpendAllowed: true },
    })).toBe(false);
  });

  it("rejects negative or non-experimental execution", () => {
    expect(canRunStreamExperiment(stream, {
      ...experiment,
      budget: { money: -1, paidSpendAllowed: false },
    })).toBe(false);
    expect(canRunStreamExperiment({ ...stream, state: "KILLED" }, experiment)).toBe(false);
  });

  it("requires explicit human approval before an experiment can run", () => {
    expect(canRunStreamExperiment(stream, experiment)).toBe(true);
    expect(canRunStreamExperiment(stream, {
      ...experiment,
      humanApprovalRequired: false,
    })).toBe(false);
  });

  it("rejects a stream with no kill criteria", () => {
    expect(() => validateIncomeStreamKit({ ...stream, killCriteria: [] })).toThrow("kill criteria");
  });
});
