export type StreamState = "DESIGN" | "EXPERIMENTAL" | "VALIDATED" | "KILLED";
export type AutonomyCeiling = "L0" | "L1" | "L2";
export type PaymentMechanism =
  | "subscription"
  | "transaction"
  | "lead"
  | "referral"
  | "licensing"
  | "service"
  | "sponsorship";

export interface IncomeStreamKit {
  id: string;
  industry: string;
  customer: string;
  problem: string;
  value: string;
  paymentMechanism: PaymentMechanism;
  autonomyCeiling: AutonomyCeiling;
  state: StreamState;
  humanGates: readonly string[];
  killCriteria: readonly string[];
  evidenceRequired: readonly string[];
  dependencies: readonly string[];
}

export interface StreamExperiment {
  streamId: string;
  hypothesis: string;
  smallestTest: string;
  successSignals: readonly string[];
  failureSignals: readonly string[];
  budget: {
    money: 0;
    paidSpendAllowed: false;
  };
  humanApprovalRequired: boolean;
}

export function validateIncomeStreamKit(stream: IncomeStreamKit): void {
  if (!stream.id || !stream.industry || !stream.customer || !stream.problem || !stream.value) {
    throw new Error("stream identity, customer, problem, and value are required");
  }
  if (stream.autonomyCeiling !== "L0" && stream.autonomyCeiling !== "L1" && stream.autonomyCeiling !== "L2") {
    throw new Error("income streams are capped at L2 autonomy");
  }
  if (stream.humanGates.length === 0) throw new Error("human gates are required");
  if (stream.killCriteria.length === 0) throw new Error("kill criteria are required");
  if (stream.evidenceRequired.length === 0) throw new Error("evidence requirements are required");
}

export function canRunStreamExperiment(
  stream: IncomeStreamKit,
  experiment: StreamExperiment,
): boolean {
  validateIncomeStreamKit(stream);
  if (experiment.streamId !== stream.id) return false;
  if (experiment.budget.money !== 0 || experiment.budget.paidSpendAllowed) return false;
  return experiment.humanApprovalRequired;
}
