import { describe, expect, it } from "vitest";

import {
  isAcceptableExecutionResult,
  validateExecutionResult,
  type AgentExecutionResult,
} from "./agent-execution-contract";

function baseResult(overrides: Partial<AgentExecutionResult> = {}): AgentExecutionResult {
  return {
    taskId: "LW-20261007-001",
    status: "VERIFYING",
    summary: "Implemented claim lease hardening and unit tests.",
    changedPaths: [
      "src/lib/agent-lease-policy.ts",
      "supabase/migrations/20261007140000_agent_claim_lease_hardening.sql",
    ],
    testsRun: [
      {
        command: "bun run test src/lib/agent-lease-policy.test.ts",
        result: "pass",
        evidence: "9 tests",
      },
    ],
    testsPassed: 1,
    testsFailed: 0,
    claims: [
      {
        statement: "Concurrent claims are mutually exclusive via atomic UPDATE",
        supportedBy: ["claim_agent_task WHERE status = READY"],
        confidence: "observed",
      },
    ],
    uncertainties: ["Live Supabase RPC behaviour not exercised in CI"],
    blockers: [],
    handoff:
      "TASK: LW-20261007-001\nSTATUS: VERIFYING\nWHAT I CHANGED: lease hardening migration + pure policy tests.\nNEXT: independent review of SQL functions.",
    recommendedNextAction:
      "Independent review of claim/lease SQL and run mark_stale against a staging DB",
    provider: { id: "grok", model: "grok-4" },
    ...overrides,
  };
}

describe("execution result contract", () => {
  it("accepts a well-formed VERIFYING result with evidence", () => {
    const issues = validateExecutionResult(baseResult());
    expect(issues).toEqual([]);
    expect(isAcceptableExecutionResult(baseResult())).toBe(true);
  });

  it("rejects silent done statuses", () => {
    const issues = validateExecutionResult(
      baseResult({ status: "DONE" as unknown as AgentExecutionResult["status"] }),
    );
    expect(issues.some((i) => i.code === "SILENT_DONE")).toBe(true);
  });

  it("rejects ACCEPTED / INTEGRATED / REVIEW as provider outcomes", () => {
    for (const status of ["ACCEPTED", "INTEGRATED", "REVIEW"] as const) {
      const issues = validateExecutionResult(
        baseResult({ status: status as unknown as AgentExecutionResult["status"] }),
      );
      expect(issues.some((i) => i.code === "SILENT_DONE")).toBe(true);
    }
  });

  it("rejects CHANGES_REQUESTED as a provider execution outcome", () => {
    const issues = validateExecutionResult(baseResult({ status: "CHANGES_REQUESTED" }));
    expect(issues.some((i) => i.code === "FORBIDDEN_OUTCOME")).toBe(true);
  });

  it("rejects provider nominating itself as reviewer", () => {
    const issues = validateExecutionResult(
      baseResult({ proposedReviewer: "grok", provider: { id: "grok" } }),
    );
    expect(issues.some((i) => i.code === "SELF_APPROVAL")).toBe(true);
  });

  it("rejects VERIFYING with no tests, claims, or paths", () => {
    const issues = validateExecutionResult(
      baseResult({
        changedPaths: [],
        testsRun: [],
        testsPassed: 0,
        testsFailed: 0,
        claims: [],
      }),
    );
    expect(issues.some((i) => i.code === "NO_EVIDENCE")).toBe(true);
  });

  it("rejects claims with confidence but no support", () => {
    const issues = validateExecutionResult(
      baseResult({
        claims: [{ statement: "It works", supportedBy: [], confidence: "observed" }],
      }),
    );
    expect(issues.some((i) => i.code === "CLAIM_WITHOUT_SUPPORT")).toBe(true);
  });

  it("rejects test count mismatches", () => {
    const issues = validateExecutionResult(baseResult({ testsPassed: 99, testsFailed: 0 }));
    expect(issues.some((i) => i.code === "TEST_COUNT_MISMATCH")).toBe(true);
  });

  it("rejects missing handoff or next action", () => {
    expect(
      validateExecutionResult(baseResult({ handoff: "short" })).some(
        (i) => i.code === "MISSING_HANDOFF",
      ),
    ).toBe(true);
    expect(
      validateExecutionResult(baseResult({ recommendedNextAction: "" })).some(
        (i) => i.code === "MISSING_NEXT_ACTION",
      ),
    ).toBe(true);
  });
});
