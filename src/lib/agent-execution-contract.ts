/**
 * Execution result contract: provider output is evidence, never silent truth.
 *
 * A provider MUST NOT be able to declare "done" without structured evidence.
 * A provider MUST NOT self-approve (ACCEPTED / INTEGRATED / REVIEW as outcome).
 * See docs/agents/ORCHESTRATION.md and HANDOFF.md.
 */

export type ExecutionOutcomeStatus =
  | "VERIFYING"
  | "BLOCKED"
  | "CHANGES_REQUESTED"
  | "FAILED"
  | "PARTIAL";

export type TestResultStatus = "pass" | "fail" | "not-run" | "error";

export interface ExecutionTestEvidence {
  command: string;
  result: TestResultStatus;
  evidence?: string;
}

export interface ExecutionClaim {
  statement: string;
  supportedBy: string[];
  confidence: "observed" | "inferred" | "unknown";
}

export interface AgentExecutionResult {
  taskId: string;
  status: ExecutionOutcomeStatus;
  summary: string;
  changedPaths: string[];
  testsRun: ExecutionTestEvidence[];
  testsPassed: number;
  testsFailed: number;
  claims: ExecutionClaim[];
  uncertainties: string[];
  blockers: string[];
  handoff: string;
  recommendedNextAction: string;
  provider: {
    id: string;
    model?: string;
  };
  /** Wall-clock duration of the attempt, if known. */
  durationMs?: number;
  /**
   * If set, must differ from provider.id when recommending review acceptance.
   * Providers cannot nominate themselves as independent reviewer.
   */
  proposedReviewer?: string;
}

export type ExecutionValidationIssue =
  | { code: "MISSING_TASK_ID"; message: string }
  | { code: "EMPTY_SUMMARY"; message: string }
  | { code: "SILENT_DONE"; message: string }
  | { code: "NO_EVIDENCE"; message: string }
  | { code: "CLAIM_WITHOUT_SUPPORT"; message: string }
  | { code: "TEST_COUNT_MISMATCH"; message: string }
  | { code: "MISSING_HANDOFF"; message: string }
  | { code: "MISSING_NEXT_ACTION"; message: string }
  | { code: "SELF_APPROVAL"; message: string }
  | { code: "FORBIDDEN_OUTCOME"; message: string };

const FORBIDDEN_PROVIDER_STATUSES = [
  "DONE",
  "ACCEPTED",
  "INTEGRATED",
  "SUCCESS",
  "COMPLETE",
  "REVIEW",
  "CLAIMED",
  "READY",
] as const;

/**
 * Validate that a provider result cannot silently declare success or self-approve.
 * Returns issues; empty array means the result is structurally acceptable.
 */
export function validateExecutionResult(result: AgentExecutionResult): ExecutionValidationIssue[] {
  const issues: ExecutionValidationIssue[] = [];

  if (!result.taskId || result.taskId.trim() === "") {
    issues.push({ code: "MISSING_TASK_ID", message: "taskId is required" });
  }
  if (!result.summary || result.summary.trim() === "") {
    issues.push({ code: "EMPTY_SUMMARY", message: "summary is required" });
  }

  const statusUpper = String(result.status).toUpperCase();
  if ((FORBIDDEN_PROVIDER_STATUSES as readonly string[]).includes(statusUpper)) {
    issues.push({
      code: "SILENT_DONE",
      message: `status ${result.status} is not a valid provider outcome; use VERIFYING, BLOCKED, FAILED, or PARTIAL`,
    });
  }

  // CHANGES_REQUESTED as a provider outcome is reserved for independent review;
  // implementers report FAILED/PARTIAL/BLOCKED instead of self-requesting changes.
  if (statusUpper === "CHANGES_REQUESTED") {
    issues.push({
      code: "FORBIDDEN_OUTCOME",
      message:
        "CHANGES_REQUESTED is a reviewer transition, not a provider execution outcome",
    });
  }

  if (
    result.proposedReviewer &&
    result.provider?.id &&
    result.proposedReviewer === result.provider.id
  ) {
    issues.push({
      code: "SELF_APPROVAL",
      message: "provider cannot nominate itself as independent reviewer",
    });
  }

  const hasTests = result.testsRun.length > 0;
  const hasClaims = result.claims.length > 0;
  const hasPaths = result.changedPaths.length > 0;
  if (!hasTests && !hasClaims && !hasPaths && result.status === "VERIFYING") {
    issues.push({
      code: "NO_EVIDENCE",
      message: "VERIFYING requires at least one of: testsRun, claims, changedPaths",
    });
  }

  for (const claim of result.claims) {
    if (claim.confidence !== "unknown" && claim.supportedBy.length === 0) {
      issues.push({
        code: "CLAIM_WITHOUT_SUPPORT",
        message: `claim "${claim.statement}" has confidence ${claim.confidence} but no supportedBy`,
      });
    }
  }

  const passCount = result.testsRun.filter((t) => t.result === "pass").length;
  const failCount = result.testsRun.filter((t) => t.result === "fail" || t.result === "error").length;
  if (result.testsPassed !== passCount || result.testsFailed !== failCount) {
    issues.push({
      code: "TEST_COUNT_MISMATCH",
      message: `testsPassed/testsFailed do not match testsRun aggregates (${passCount}/${failCount})`,
    });
  }

  if (!result.handoff || result.handoff.trim().length < 20) {
    issues.push({
      code: "MISSING_HANDOFF",
      message: "handoff must be a substantive durable note (min ~20 chars)",
    });
  }
  if (!result.recommendedNextAction || result.recommendedNextAction.trim() === "") {
    issues.push({
      code: "MISSING_NEXT_ACTION",
      message: "recommendedNextAction is required",
    });
  }

  return issues;
}

export function isAcceptableExecutionResult(result: AgentExecutionResult): boolean {
  return validateExecutionResult(result).length === 0;
}
