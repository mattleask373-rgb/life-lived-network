/**
 * Execution result contract: provider output is evidence, never silent truth.
 *
 * A provider MUST NOT be able to declare "done" without structured evidence.
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
}

export type ExecutionValidationIssue =
  | { code: "MISSING_TASK_ID"; message: string }
  | { code: "EMPTY_SUMMARY"; message: string }
  | { code: "SILENT_DONE"; message: string }
  | { code: "NO_EVIDENCE"; message: string }
  | { code: "CLAIM_WITHOUT_SUPPORT"; message: string }
  | { code: "TEST_COUNT_MISMATCH"; message: string }
  | { code: "MISSING_HANDOFF"; message: string }
  | { code: "MISSING_NEXT_ACTION"; message: string };

/**
 * Validate that a provider result cannot silently declare success.
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

  // "done" / ACCEPTED / INTEGRATED are not valid provider outcome statuses.
  const forbidden = ["DONE", "ACCEPTED", "INTEGRATED", "SUCCESS", "COMPLETE"];
  if (forbidden.includes(String(result.status).toUpperCase())) {
    issues.push({
      code: "SILENT_DONE",
      message: `status ${result.status} is not a valid provider outcome; use VERIFYING or BLOCKED`,
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
