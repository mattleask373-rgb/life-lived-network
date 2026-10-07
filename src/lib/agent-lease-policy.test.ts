import { describe, expect, it } from "vitest";

import {
  canClaim,
  canHeartbeat,
  canReclaim,
  canRelease,
  DEFAULT_HEARTBEAT_GRACE_MS,
  evaluateStale,
  isActiveOwnership,
  resolveClaimRace,
  type LeaseSnapshot,
} from "./agent-lease-policy";

function snap(partial: Partial<LeaseSnapshot> & Pick<LeaseSnapshot, "status">): LeaseSnapshot {
  return {
    taskId: "LW-20261007-001",
    owner: "grok",
    leaseExpiry: new Date("2026-10-07T16:00:00.000Z"),
    lastHeartbeat: new Date("2026-10-07T14:00:00.000Z"),
    ...partial,
  };
}

describe("agent lease policy", () => {
  it("only READY is claimable; STALE/READY are reclaimable", () => {
    expect(canClaim("READY")).toBe(true);
    expect(canClaim("CLAIMED")).toBe(false);
    expect(canClaim("STALE")).toBe(false);
    expect(canReclaim("STALE")).toBe(true);
    expect(canReclaim("READY")).toBe(true);
    expect(canReclaim("CLAIMED")).toBe(false);
  });

  it("active ownership statuses are CLAIMED | IN_PROGRESS | VERIFYING", () => {
    expect(isActiveOwnership("CLAIMED")).toBe(true);
    expect(isActiveOwnership("IN_PROGRESS")).toBe(true);
    expect(isActiveOwnership("VERIFYING")).toBe(true);
    expect(isActiveOwnership("READY")).toBe(false);
    expect(isActiveOwnership("STALE")).toBe(false);
  });

  it("does not mark STALE while lease is still valid", () => {
    const now = new Date("2026-10-07T15:00:00.000Z");
    const decision = evaluateStale(
      snap({
        status: "CLAIMED",
        leaseExpiry: new Date("2026-10-07T16:00:00.000Z"),
        lastHeartbeat: new Date("2026-10-07T14:30:00.000Z"),
      }),
      now,
    );
    expect(decision.isStale).toBe(false);
    expect(decision.reason).toMatch(/lease still valid/);
  });

  it("does not mark STALE inside heartbeat grace after lease expiry", () => {
    const leaseExpiry = new Date("2026-10-07T16:00:00.000Z");
    const lastHeartbeat = new Date("2026-10-07T15:50:00.000Z");
    const now = new Date(leaseExpiry.getTime() + 10 * 60 * 1000); // 10 min after expiry
    const decision = evaluateStale(
      snap({ status: "IN_PROGRESS", leaseExpiry, lastHeartbeat }),
      now,
      DEFAULT_HEARTBEAT_GRACE_MS,
    );
    expect(decision.isStale).toBe(false);
    expect(decision.reason).toMatch(/heartbeat grace/);
  });

  it("marks STALE when lease expired AND heartbeat grace exceeded", () => {
    const leaseExpiry = new Date("2026-10-07T16:00:00.000Z");
    const lastHeartbeat = new Date("2026-10-07T15:00:00.000Z");
    const now = new Date(lastHeartbeat.getTime() + DEFAULT_HEARTBEAT_GRACE_MS + 60_000);
    const decision = evaluateStale(
      snap({ status: "CLAIMED", leaseExpiry, lastHeartbeat }),
      now,
    );
    expect(decision.isStale).toBe(true);
    expect(decision.reason).toMatch(/lease expired and heartbeat grace/);
  });

  it("rejects heartbeat from non-owner or after lease expiry", () => {
    const now = new Date("2026-10-07T15:00:00.000Z");
    const base = snap({
      status: "CLAIMED",
      owner: "grok",
      leaseExpiry: new Date("2026-10-07T16:00:00.000Z"),
    });

    expect(canHeartbeat(base, "chatgpt", now).ok).toBe(false);
    expect(canHeartbeat(base, "grok", now).ok).toBe(true);

    const expired = snap({
      status: "CLAIMED",
      owner: "grok",
      leaseExpiry: new Date("2026-10-07T14:00:00.000Z"),
    });
    expect(canHeartbeat(expired, "grok", now).ok).toBe(false);
    expect(canHeartbeat(expired, "grok", now).reason).toMatch(/lease expired/);
  });

  it("rejects release from non-owner or non-active status", () => {
    const active = snap({ status: "CLAIMED", owner: "grok" });
    expect(canRelease(active, "grok").ok).toBe(true);
    expect(canRelease(active, "chatgpt").ok).toBe(false);

    const ready = snap({ status: "READY", owner: null });
    expect(canRelease(ready, "grok").ok).toBe(false);
  });

  it("claim race is mutually exclusive (first committed wins)", () => {
    const { winner, loser } = resolveClaimRace("agent-a", "agent-b");
    expect(winner).not.toBe(loser);
    expect(["agent-a", "agent-b"]).toContain(winner);
    expect(["agent-a", "agent-b"]).toContain(loser);
  });

  it("never treats non-ownership statuses as stale candidates", () => {
    const now = new Date("2026-10-08T00:00:00.000Z");
    for (const status of ["READY", "STALE", "BLOCKED", "DONE", "REVIEW"] as const) {
      const decision = evaluateStale(
        snap({
          status,
          leaseExpiry: new Date("2026-10-07T01:00:00.000Z"),
          lastHeartbeat: new Date("2026-10-07T00:00:00.000Z"),
        }),
        now,
      );
      expect(decision.isStale).toBe(false);
    }
  });
});
