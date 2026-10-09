import type { IncomeStreamKit, StreamExperiment } from "./income-stream-kit";

export interface BoundedExperimentPlan {
  id: string;
  hypothesis: string;
  question: string;
  procedure: readonly string[];
  successCriteria: readonly string[];
  failureCriteria: readonly string[];
  reversible: boolean;
  requiresHumanGate: boolean;
  owner: "human" | "human_ai";
  paymentMechanism: IncomeStreamKit["paymentMechanism"];
}

export function streamToExperimentPlan(
  stream: IncomeStreamKit,
  experiment: StreamExperiment,
): BoundedExperimentPlan {
  if (experiment.streamId !== stream.id) throw new Error("experiment stream mismatch");
  if (!experiment.humanApprovalRequired) throw new Error("human approval is required");
  if (experiment.budget.money !== 0 || experiment.budget.paidSpendAllowed) {
    throw new Error("paid activity is outside the bounded experiment contract");
  }

  return {
    id: "stream-experiment-" + stream.id,
    hypothesis: experiment.hypothesis,
    question: "Does the smallest safe test produce the claimed value signal?",
    procedure: [experiment.smallestTest],
    successCriteria: [...experiment.successSignals],
    failureCriteria: [...experiment.failureSignals, ...stream.killCriteria],
    reversible: true,
    requiresHumanGate: true,
    owner: "human_ai",
    paymentMechanism: stream.paymentMechanism,
  };
}
