import { describe, expect, it } from "vitest";

import { shouldIgnoreDuplicate } from "./agent-orchestration";
import {
  canClaim,
  canHeartbeat,
  canReclaim,
  canRelease,
  evaluateStale,
  resolveClaimRace,
  type LeaseSnapshot,
  DEFAULT_HEARTBEAT_GRACE_MS,
} from "./agent-lease-policy";
import { evaluateTransition } from "./agent-state-machine";
import { isAcceptableExecutionResult, type AgentExecutionResult } from "./agent-execution-contract";

/**
 * Hour-3 concurrency / boundary matrix (pure policy).
 * Does NOT prove live Postgres serialisation — only the intended contract.
 */

function activeLease(owner: string, status: LeaseSnapshot["status"] = "CLAIMED"): LeaseSnapshot {
  return {
    taskId: "LW-20261007-001",
    status,
    owner,
    leaseExpiry: new Date("2026-10-07T18:00:00.000Z"),
    lastHeartbeat: new Date("2026-10-07T14:00:00.000Z"),
  };
}

describe("concurrency matrix (pure policy)", () => {
  describe("claim race", () => {
    it("only READY is claimable", () => {
      expect(canClaim("READY")).toBe(true);
      expect(canClaim("CLAIMED")).toBe(false);
      expect(canClaim("STALE")).toBe(false);
    });

    it("two claimants are mutually exclusive at the policy layer", () => {
      const race = resolveClaimRace("agent-a", "agent-b");
      expect(race.winner).not.toBe(race.loser);
    });
  });

  describe("reclaim race", () => {
    it("only STALE or READY are reclaimable", () => {
      expect(canReclaim("STALE")).toBe(true);
      expect(canReclaim("READY")).toBe(true);
      expect(canReclaim("CLAIMED")).toBe(false);
      expect(canReclaim("IN_PROGRESS")).toBe(false);
    });
  });

  describe("heartbeat vs expiry", () => {
    it("valid lease accepts owner heartbeat", () => {
      const now = new Date("2026-10-07T15:00:00.000Z");
      expect(canHeartbeat(activeLease("grok"), "grok", now).ok).toBe(true);
    });

    it("expired lease rejects heartbeat even inside stale grace", () => {
      const leaseExpiry = new Date("2026-10-07T16:00:00.000Z");
      const lastHeartbeat = new Date("2026-10-07T15:50:00.000Z");
      const now = new Date(leaseExpiry.getTime() + 10 * 60 * 1000);
      const snap: LeaseSnapshot = {
        taskId: "LW-20261007-001",
        status: "IN_PROGRESS",
        owner: "grok",
        leaseExpiry,
        lastHeartbeat,
      };
      expect(evaluateStale(snap, now, DEFAULT_HEARTBEAT_GRACE_MS).isStale).toBe(false);
      expect(canHeartbeat(snap, "grok", now).ok).toBe(false);
    });
  });

  describe("post-reclaim ownership", () => {
    it("old owner cannot heartbeat or release after reclaim", () => {
      const now = new Date("2026-10-07T17:00:00.000Z");
      const reclaimed = activeLease("chatgpt");
      reclaimed.leaseExpiry = new Date("2026-10-07T20:00:00.000Z");
      reclaimed.lastHeartbeat = now;
      expect(canHeartbeat(reclaimed, "grok", now).ok).toBe(false);
      expect(canRelease(reclaimed, "grok").ok).toBe(false);
      expect(canHeartbeat(reclaimed, "chatgpt", now).ok).toBe(true);
      expect(canRelease(reclaimed, "chatgpt").ok).toBe(true);
    });
  });

  describe("duplicate webhook", () => {
    it("repeated event_id is ignored", () => {
      const seen = new Set(["event-1"]);
      expect(shouldIgnoreDuplicate("event-1", seen)).toBe(true);
      expect(shouldIgnoreDuplicate("event-2", seen)).toBe(false);
    });
  });

  describe("self-approval and human gate", () => {
    it("implementer cannot ACCEPTED own work", () => {
      expect(
        evaluateTransition({
          from: "REVIEW",
          to: "ACCEPTED",
          actorId: "grok",
          owner: "grok",
          leaseValid: false,
        }).allowed,
      ).toBe(false);
    });

    it("independent reviewer can ACCEPTED", () => {
      expect(
        evaluateTransition({
          from: "REVIEW",
          to: "ACCEPTED",
          actorId: "chatgpt",
          owner: "grok",
          leaseValid: false,
        }).allowed,
      ).toBe(true);
    });

    it("only human can INTEGRATED", () => {
      expect(
        evaluateTransition({
          from: "ACCEPTED",
          to: "INTEGRATED",
          actorId: "grok",
          owner: "grok",
          leaseValid: false,
        }).allowed,
      ).toBe(false);
      expect(
        evaluateTransition({
          from: "ACCEPTED",
          to: "INTEGRATED",
          actorId: "human",
          owner: "grok",
          leaseValid: false,
        }).allowed,
      ).toBe(true);
    });

    it("DONE is never a legal destination", () => {
      expect(
        evaluateTransition({
          from: "IN_PROGRESS",
          to: "DONE",
          actorId: "grok",
          owner: "grok",
          leaseValid: true,
        }).allowed,
      ).toBe(false);
    });

    it("provider cannot emit DONE or ACCEPTED", () => {
      const bad: AgentExecutionResult = {
        taskId: "LW-20261007-001",
        status: "DONE" as unknown as AgentExecutionResult["status"],
        summary: "done",
        changedPaths: ["x"],
        testsRun: [{ command: "t", result: "pass" }],
        testsPassed: 1,
        testsFailed: 0,
        claims: [],
        uncertainties: [],
        blockers: [],
        handoff: "TASK: x STATUS: done with enough characters here",
        recommendedNextAction: "merge",
        provider: { id: "grok" },
      };
      expect(isAcceptableExecutionResult(bad)).toBe(false);
    });
  });

  describe("CANCELLED", () => {
    it("owner may cancel active ownership states", () => {
      for (const from of ["CLAIMED", "IN_PROGRESS", "VERIFYING", "CHANGES_REQUESTED"] as const) {
        expect(
          evaluateTransition({
            from,
            to: "CANCELLED",
            actorId: "grok",
            owner: "grok",
            leaseValid: true,
          }).allowed,
        ).toBe(true);
      }
    });

    it("non-owner cannot cancel active work", () => {
      expect(
        evaluateTransition({
          from: "IN_PROGRESS",
          to: "CANCELLED",
          actorId: "chatgpt",
          owner: "grok",
          leaseValid: true,
        }).allowed,
      ).toBe(false);
    });

    it("human may cancel READY/BLOCKED/STALE", () => {
      for (const from of ["READY", "BLOCKED", "STALE"] as const) {
        expect(
          evaluateTransition({
            from,
            to: "CANCELLED",
            actorId: "human",
            owner: null,
            leaseValid: false,
          }).allowed,
        ).toBe(true);
      }
    });
  });
});
