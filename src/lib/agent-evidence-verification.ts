/** Phase 9 — Evidence-gated verification kernel. */
import type { AgentExecutionResult, ExecutionTestEvidence } from "./agent-execution-contract";

export type VerificationDecision =
  | Readonly<{ kind: "REVIEW"; taskId: string; reason: string; evidenceRefs: readonly string[] }>
  | Readonly<{ kind: "BLOCK"; taskId: string; reason: string; missing: readonly string[] }>
  | Readonly<{ kind: "FAIL"; taskId: string; reason: string }>;

export type VerificationPolicy = Readonly<{
  requirePassingTest: boolean;
  requireChangedPathOrExplicitNoChange: boolean;
  requireIndependentReviewer: boolean;
  reviewerId?: string | null;
}>;

function passingTests(tests: readonly ExecutionTestEvidence[]): number {
  return tests.filter((test) => test.result === "pass").length;
}

function evidenceRefsFor(result: AgentExecutionResult): readonly string[] {
  const refs = [
    ...result.changedPaths,
    ...result.claims.flatMap((claim) => claim.supportedBy),
    ...result.testsRun.filter((test) => test.evidence?.trim()).map((test) => test.evidence as string),
  ];
  return [...new Set(refs)];
}

/**
 * Decide the next verification state without changing durable task state.
 * Provider failure is terminal for the attempt; BLOCKED/PARTIAL remain non-accepted.
 * This kernel never returns ACCEPTED, INTEGRATED, or DONE.
 */
export function verifyExecutionResult(
  result: AgentExecutionResult,
  policy: VerificationPolicy,
): VerificationDecision {
  if (!result.taskId.trim()) return { kind: "FAIL", taskId: result.taskId, reason: "task identity is required" };

  if (result.status === "FAILED") {
    return { kind: "FAIL", taskId: result.taskId, reason: "provider execution failed; preserve attempt evidence" };
  }

  if (result.status === "BLOCKED" || result.status === "PARTIAL") {
    return {
      kind: "BLOCK",
      taskId: result.taskId,
      reason: `provider returned ${result.status}; completion requires resolution or explicit human decision`,
      missing: result.blockers.length > 0 ? result.blockers : ["resolution of provider blocker"],
    };
  }

  const missing: string[] = [];
  const refs = evidenceRefsFor(result);
  if (policy.requirePassingTest && passingTests(result.testsRun) === 0) missing.push("at least one passing test");
  if (policy.requireChangedPathOrExplicitNoChange && result.changedPaths.length === 0 && !result.summary.toLowerCase().includes("no change")) {
    missing.push("changed-path evidence or explicit no-change statement");
  }
  if (result.claims.some((claim) => claim.confidence !== "unknown" && claim.supportedBy.length === 0)) {
    missing.push("supporting evidence for every non-unknown claim");
  }
  if (policy.requireIndependentReviewer) {
    if (!policy.reviewerId?.trim()) missing.push("independent reviewer identity");
    else if (policy.reviewerId === result.provider.id) missing.push("reviewer different from provider");
  }
  if (missing.length > 0) {
    return { kind: "BLOCK", taskId: result.taskId, reason: "execution evidence is insufficient for independent verification", missing };
  }
  return {
    kind: "REVIEW",
    taskId: result.taskId,
    reason: "evidence is sufficient to enter independent verification; no acceptance authority granted",
    evidenceRefs: refs,
  };
}