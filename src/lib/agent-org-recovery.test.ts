import { describe, expect, it } from "vitest";

import { shouldIgnoreDuplicate } from "./agent-orchestration";
import {
  canClaim,
  canReclaim,
  evaluateStale,
  resolveClaimRace,
  type LeaseSnapshot,
  DEFAULT_HEARTBEAT_GRACE_MS,
} from "./agent-lease-policy";
import {
  EXAMPLE_PROVIDER_DESCRIPTORS,
  selectProvider,
  type ProviderSelectionPolicy,
} from "./agent-provider";
import { isAcceptableExecutionResult, type AgentExecutionResult } from "./agent-execution-contract";

/**
 * Priority 6 — test the organisation itself.
 * These encode control-plane recovery guarantees without requiring a live DB.
 */

describe("organisational recovery scenarios", () => {
  it("if the webhook fires twice, we get one task (event_id idempotency)", () => {
    const processed = new Set<string>(["event-abc"]);
    expect(shouldIgnoreDuplicate("event-abc", processed)).toBe(true);
    expect(shouldIgnoreDuplicate("event-def", processed)).toBe(false);
  });

  it("if two agents race for a READY task, both cannot own it", () => {
    // Claim only succeeds from READY; second concurrent claim loses the race.
    expect(canClaim("READY")).toBe(true);
    expect(canClaim("CLAIMED")).toBe(false);
    const race = resolveClaimRace("grok", "chatgpt");
    expect(race.winner).not.toBe(race.loser);
  });

  it("if an agent dies halfway through, another agent can recover via STALE → reclaim", () => {
    const leaseExpiry = new Date("2026-10-07T12:00:00.000Z");
    const lastHeartbeat = new Date("2026-10-07T11:00:00.000Z");
    const now = new Date(leaseExpiry.getTime() + DEFAULT_HEARTBEAT_GRACE_MS + 60_000);

    const dead: LeaseSnapshot = {
      taskId: "LW-20261007-001",
      status: "IN_PROGRESS",
      owner: "plane_ai",
      leaseExpiry,
      lastHeartbeat,
    };

    const staleDecision = evaluateStale(dead, now);
    expect(staleDecision.isStale).toBe(true);

    // After mark_stale, status becomes STALE → reclaimable by another provider.
    expect(canReclaim("STALE")).toBe(true);
    expect(canReclaim("IN_PROGRESS")).toBe(false);
  });

  it("if Plane AI credits disappear, selection still yields another eligible provider", () => {
    const policy: ProviderSelectionPolicy = {
      preferIndependentReviewer: true,
      requireHumanFor: ["P0"],
      excludeProviders: ["plane_ai"],
    };
    const selected = selectProvider(
      EXAMPLE_PROVIDER_DESCRIPTORS,
      { autonomy: "L2", risk: "P2", lane: "IMPLEMENTATION" },
      policy,
    );
    expect(selected).not.toBeNull();
    expect(selected!.id).not.toBe("plane_ai");
  });

  it("if no provider is eligible, selection returns null (task stays READY/BLOCKED)", () => {
    const policy: ProviderSelectionPolicy = {
      preferIndependentReviewer: true,
      requireHumanFor: ["P0", "P1", "P2", "P3"],
      excludeProviders: ["human"],
    };
    const selected = selectProvider(
      EXAMPLE_PROVIDER_DESCRIPTORS,
      { autonomy: "L2", risk: "P1", lane: "IMPLEMENTATION" },
      policy,
    );
    expect(selected).toBeNull();
  });

  it("if an agent lies about success, independent validation rejects silent done", () => {
    const lie: AgentExecutionResult = {
      taskId: "LW-20261007-001",
      status: "DONE" as unknown as AgentExecutionResult["status"],
      summary: "All good",
      changedPaths: [],
      testsRun: [],
      testsPassed: 0,
      testsFailed: 0,
      claims: [],
      uncertainties: [],
      blockers: [],
      handoff: "done",
      recommendedNextAction: "merge",
      provider: { id: "untrusted" },
    };
    expect(isAcceptableExecutionResult(lie)).toBe(false);
  });

  it("human gate: P0 requires human under default policy", () => {
    const policy: ProviderSelectionPolicy = {
      preferIndependentReviewer: true,
      requireHumanFor: ["P0"],
      excludeProviders: [],
    };
    const selected = selectProvider(
      EXAMPLE_PROVIDER_DESCRIPTORS,
      { autonomy: "L2", risk: "P0", lane: "SECURITY" },
      policy,
    );
    expect(selected?.id).toBe("human");
  });
});
