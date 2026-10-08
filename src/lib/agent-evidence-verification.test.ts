import { describe, expect, it } from "vitest";
import { verifyExecutionResult, type VerificationPolicy } from "./agent-evidence-verification";
import type { AgentExecutionResult } from "./agent-execution-contract";

const policy: VerificationPolicy = {
  requirePassingTest: true,
  requireChangedPathOrExplicitNoChange: true,
  requireIndependentReviewer: true,
  reviewerId: "independent-reviewer",
};

const base: AgentExecutionResult = {
  taskId: "task-1",
  status: "VERIFYING",
  summary: "Implemented bounded change.",
  changedPaths: ["src/lib/example.ts"],
  testsRun: [{ command: "bun test", result: "pass", evidence: "test-run-1" }],
  testsPassed: 1,
  testsFailed: 0,
  claims: [{ statement: "Change is covered", supportedBy: ["test-run-1"], confidence: "observed" }],
  uncertainties: [],
  blockers: [],
  handoff: "Independent review is required before any acceptance transition.",
  recommendedNextAction: "Review evidence and verify changed paths.",
  provider: { id: "provider-a" },
};

describe("evidence-gated verification", () => {
  it("allows evidence-rich results into independent review", () => {
    const decision = verifyExecutionResult(base, policy);
    expect(decision.kind).toBe("REVIEW");
  });

  it("blocks when no passing test exists", () => {
    const decision = verifyExecutionResult(
      { ...base, testsRun: [{ command: "bun test", result: "not-run" }], testsPassed: 0 },
      policy,
    );
    expect(decision.kind).toBe("BLOCK");
    if (decision.kind === "BLOCK") expect(decision.missing).toContain("at least one passing test");
  });

  it("blocks provider self-review", () => {
    const decision = verifyExecutionResult(base, { ...policy, reviewerId: "provider-a" });
    expect(decision.kind).toBe("BLOCK");
    if (decision.kind === "BLOCK") expect(decision.missing).toContain("reviewer different from provider");
  });

  it("fails closed on provider failure", () => {
    const decision = verifyExecutionResult({ ...base, status: "FAILED" }, policy);
    expect(decision.kind).toBe("FAIL");
  });

  it("does not promote blocked or partial provider output", () => {
    for (const status of ["BLOCKED", "PARTIAL"] as const) {
      const decision = verifyExecutionResult({ ...base, status, blockers: ["waiting on dependency"] }, policy);
      expect(decision.kind).toBe("BLOCK");
    }
  });

  it("requires reviewer identity when independent review is mandatory", () => {
    const decision = verifyExecutionResult(base, { ...policy, reviewerId: null });
    expect(decision.kind).toBe("BLOCK");
  });

  it("preserves evidence references without granting acceptance", () => {
    const decision = verifyExecutionResult(base, policy);
    expect(decision.kind).toBe("REVIEW");
    if (decision.kind === "REVIEW") {
      expect(decision.evidenceRefs).toContain("src/lib/example.ts");
      expect(decision.evidenceRefs).toContain("test-run-1");
    }
  });
});
