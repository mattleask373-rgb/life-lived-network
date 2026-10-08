/**
 * Multi-stream kit contract (pure).
 * Scaffolds income/product streams for the AI fleet OS.
 * Does not launch companies, spend money, or claim revenue.
 */

export type StreamAutonomy = "L0" | "L1" | "L2";

export type StreamDefinition = Readonly<{
  streamId: string;
  name: string;
  customer: string;
  problem: string;
  valueProposition: string;
  paymentMechanism: string;
  /** Required: when to kill the stream. */
  killCriteria: string;
  autonomyCeiling: StreamAutonomy;
  humanGates: readonly string[];
  /** Optional known cost driver — use COST UNKNOWN if unmeasured. */
  costNote?: string;
  dataSource?: string;
  distribution?: string;
}>;

export type StreamKitValidation =
  | Readonly<{ ok: true; stream: StreamDefinition }>
  | Readonly<{ ok: false; errors: readonly string[] }>;

const REQUIRED_GATES = ["merge", "production_deploy", "paid_spend", "official_publish"] as const;

export function validateStreamKit(input: StreamDefinition): StreamKitValidation {
  const errors: string[] = [];

  if (!input.streamId?.trim()) errors.push("streamId required");
  if (!input.name?.trim()) errors.push("name required");
  if (!input.customer?.trim()) errors.push("customer required");
  if (!input.problem?.trim()) errors.push("problem required");
  if (!input.valueProposition?.trim()) errors.push("valueProposition required");
  if (!input.paymentMechanism?.trim()) errors.push("paymentMechanism required");
  if (!input.killCriteria?.trim()) errors.push("killCriteria required");

  if (!(["L0", "L1", "L2"] as const).includes(input.autonomyCeiling)) {
    errors.push("autonomyCeiling must be L0, L1, or L2");
  }

  for (const g of REQUIRED_GATES) {
    if (!input.humanGates.includes(g)) {
      errors.push(`humanGates must include ${g}`);
    }
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, stream: input };
}

/** Example scaffold for Life Lived Network flagship — not a revenue claim. */
export const FLAGSHIP_STREAM_EXAMPLE: StreamDefinition = {
  streamId: "lln-flagship",
  name: "Life Lived Network",
  customer: "People seeking local meaningful activity",
  problem: "Intention does not reliably become verified local opportunity",
  valueProposition: "Truthful local possibility → action with provenance",
  paymentMechanism: "TBD — SaaS and/or services; no fabricated ARPU",
  killCriteria: "No retention evidence after bounded experiments; or compliance risk",
  autonomyCeiling: "L2",
  humanGates: ["merge", "production_deploy", "paid_spend", "official_publish"],
  costNote: "COST UNKNOWN until provider metering wired",
  dataSource: "canonical findSupply / ingest",
  distribution: "SEO locality pages only when indexable; partners later",
};
