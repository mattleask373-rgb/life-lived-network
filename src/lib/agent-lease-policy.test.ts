import { describe, expect, it } from "vitest";
import {
  canClaim,
  canFence,
  canHeartbeat,
  canReclaim,
  canRelease,
  evaluateStale,
  resolveClaimRace,
} from "./agent-lease-policy";

const base = {
  taskId: "task-1",
  status: "CLAIMED" as const,
  owner: "run-a",
  leaseExpiry: new Date("2026-10-08T01:00:00Z"),
  lastHeartbeat: new Date("2026-10-08T00:00:00Z"),
  leaseGeneration: 2,
  leaseToken: "token-a",
};

describe("agent lease policy", () => {
  it("allows only READY claims and STALE/READY reclaim", () => {
    expect(canClaim("READY")).toBe(true);
    expect(canClaim("CLAIMED")).toBe(false);
    expect(canReclaim("STALE")).toBe(true);
    expect(canReclaim("IN_PROGRESS")).toBe(false);
  });

  it("rejects heartbeat from another owner or expired lease", () => {
    expect(canHeartbeat(base, "run-b", new Date("2026-10-08T00:30:00Z")).ok).toBe(false);
    expect(canHeartbeat(base, "run-a", new Date("2026-10-08T01:01:00Z")).ok).toBe(false);
  });

  it("requires the exact fencing generation and token", () => {
    expect(canFence(base, 2, "token-a").ok).toBe(true);
    expect(canFence(base, 1, "token-a").ok).toBe(false);
    expect(canFence(base, 2, "wrong").ok).toBe(false);
  });

  it("rejects release by a different owner", () => {
    expect(canRelease(base, "run-b").ok).toBe(false);
    expect(canRelease(base, "run-a").ok).toBe(true);
  });

  it("marks ownership stale only after both expiry and heartbeat grace", () => {
    expect(
      evaluateStale(base, new Date("2026-10-08T01:30:00Z")).isStale,
    ).toBe(false);
    expect(
      evaluateStale(base, new Date("2026-10-08T01:46:00Z")).isStale,
    ).toBe(true);
  });

  it("models duplicate claims as single-winner", () => {
    expect(resolveClaimRace("run-a", "run-b")).toEqual({
      winner: "run-a",
      loser: "run-b",
    });
  });
});
