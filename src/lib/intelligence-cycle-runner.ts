export type EpistemicState =
  | "REAL"
  | "SUPPORTED"
  | "PLAUSIBLE"
  | "EXPERIMENTAL"
  | "SPECULATIVE"
  | "UNKNOWN"
  | "CONTRADICTED";

export type RiskLevel = "P0" | "P1" | "P2" | "P3";

export interface Evidence {
  id: string;
  source: string;
  epistemic: EpistemicState;
  observedAt: string;
  attemptId?: string;
}

export interface Opportunity {
  id: string;
  evidenceIds: string[];
  epistemic: EpistemicState;
  risk: RiskLevel;
  reversible: boolean;
  humanGate: boolean;
}

export interface Hypothesis {
  id: string;
  opportunityId: string;
  epistemic: "EXPERIMENTAL" | "SPECULATIVE";
}

export interface CycleTask {
  id: string;
  hypothesisId: string;
  requiredCapability: string;
  humanGate: boolean;
  scope: string;
}

export interface AuthorityContext {
  actorId: string;
  runId: string;
  scope: string;
  leaseGeneration: number;
  attemptId: string;
}

export interface CycleCandidate {
  opportunity: Opportunity;
  hypothesis: Hypothesis;
  task: CycleTask;
}

export interface CycleTrace {
  cycleId: string;
  sourceEvidence: Evidence[];
  opportunity: Opportunity;
  hypothesis: Hypothesis;
  task: CycleTask;
  authority: AuthorityContext;
  providerId: string;
  producedEvidence?: Evidence;
  verification?: Evidence;
  realityDelta?: string;
  learning?: string;
  nextCandidateId?: string;
  unresolvedBlockers: string[];
}

export interface CyclePolicy {
  allowedScopes: readonly string[];
  allowedCapabilities: readonly string[];
  allowHumanGate: boolean;
}

export interface CycleResult {
  status: "COMPLETED" | "BLOCKED";
  trace: CycleTrace;
}

export function epistemicRank(state: EpistemicState): number {
  return {
    UNKNOWN: 0,
    SPECULATIVE: 1,
    EXPERIMENTAL: 2,
    PLAUSIBLE: 3,
    SUPPORTED: 4,
    REAL: 5,
    CONTRADICTED: -1,
  }[state];
}

function assertNoCertaintyInflation(before: EpistemicState, after: EpistemicState): void {
  if (after === "CONTRADICTED") return;
  if (epistemicRank(after) > epistemicRank(before)) {
    throw new Error(`epistemic inflation: ${before} -> ${after}`);
  }
}

function stableSortCandidates(candidates: readonly CycleCandidate[]): CycleCandidate[] {
  return [...candidates].sort((a, b) =>
    a.opportunity.id.localeCompare(b.opportunity.id) ||
    a.hypothesis.id.localeCompare(b.hypothesis.id) ||
    a.task.id.localeCompare(b.task.id),
  );
}

export function selectCandidate(
  candidates: readonly CycleCandidate[],
  policy: CyclePolicy,
): CycleCandidate | undefined {
  return stableSortCandidates(candidates).find((candidate) =>
    policy.allowedScopes.includes(candidate.task.scope) &&
    policy.allowedCapabilities.includes(candidate.task.requiredCapability) &&
    (!candidate.task.humanGate || policy.allowHumanGate),
  );
}

export function planCycle(
  cycleId: string,
  candidates: readonly CycleCandidate[],
  authority: AuthorityContext,
  providerId: string,
  sourceEvidence: readonly Evidence[],
  policy: CyclePolicy,
): CycleResult {
  const candidate = selectCandidate(candidates, policy);

  if (!candidate) {
    return {
      status: "BLOCKED",
      trace: {
        cycleId,
        sourceEvidence: [...sourceEvidence],
        opportunity: candidates[0]?.opportunity ?? {
          id: "none",
          evidenceIds: [],
          epistemic: "UNKNOWN",
          risk: "P0",
          reversible: false,
          humanGate: true,
        },
        hypothesis: candidates[0]?.hypothesis ?? {
          id: "none",
          opportunityId: "none",
          epistemic: "SPECULATIVE",
        },
        task: candidates[0]?.task ?? {
          id: "none",
          hypothesisId: "none",
          requiredCapability: "none",
          humanGate: true,
          scope: authority.scope,
        },
        authority,
        providerId,
        unresolvedBlockers: ["no eligible candidate"],
      },
    };
  }

  if (authority.scope !== candidate.task.scope) {
    throw new Error("authority scope does not match task scope");
  }

  if (candidate.task.humanGate && !policy.allowHumanGate) {
    throw new Error("human-gated task cannot bypass gate");
  }

  return {
    status: "COMPLETED",
    trace: {
      cycleId,
      sourceEvidence: [...sourceEvidence],
      opportunity: candidate.opportunity,
      hypothesis: candidate.hypothesis,
      task: candidate.task,
      authority,
      providerId,
      unresolvedBlockers: [],
    },
  };
}

export function recordProviderEvidence(
  trace: CycleTrace,
  evidence: Evidence,
): CycleTrace {
  if (evidence.attemptId !== trace.authority.attemptId) {
    throw new Error("evidence attempt does not match authority attempt");
  }
  return { ...trace, producedEvidence: evidence };
}

export function verifyEvidence(
  trace: CycleTrace,
  verification: Evidence,
): CycleTrace {
  if (!trace.producedEvidence) {
    throw new Error("cannot verify without produced evidence");
  }
  if (verification.attemptId !== trace.authority.attemptId) {
    throw new Error("verification attempt does not match authority attempt");
  }
  assertNoCertaintyInflation(
    trace.producedEvidence.epistemic,
    verification.epistemic,
  );
  return { ...trace, verification };
}

export function completeLearning(
  trace: CycleTrace,
  realityDelta: string,
  learning: string,
  nextCandidateId?: string,
): CycleTrace {
  if (!trace.verification) {
    throw new Error("cannot learn before independent verification");
  }
  return {
    ...trace,
    realityDelta,
    learning,
    nextCandidateId,
  };
}
