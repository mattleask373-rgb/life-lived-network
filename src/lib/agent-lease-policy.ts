/**
 * Pure lease / ownership policy for the agent control plane.
 * No I/O. Unit-testable without Supabase.
 *
 * Canonical semantics: docs/agents/CLAIM-LEASE-HEARTBEAT.md
 */

export type LeaseStatus =
  | "DISCOVERED"
  | "READY"
  | "CLAIMED"
  | "IN_PROGRESS"
  | "VERIFYING"
  | "REVIEW"
  | "CHANGES_REQUESTED"
  | "ACCEPTED"
  | "INTEGRATED"
  | "BLOCKED"
  | "STALE"
  | "ABANDONED"
  | "CANCELLED"
  | "DONE";

export const ACTIVE_OWNERSHIP_STATUSES: readonly LeaseStatus[] = [
  "CLAIMED",
  "IN_PROGRESS",
  "VERIFYING",
] as const;

export const CLAIMABLE_STATUSES: readonly LeaseStatus[] = ["READY"] as const;

export const RECLAIMABLE_STATUSES: readonly LeaseStatus[] = ["STALE", "READY"] as const;

export interface LeaseSnapshot {
  taskId: string;
  status: LeaseStatus;
  owner: string | null;
  leaseExpiry: Date | null;
  lastHeartbeat: Date | null;
  leaseGeneration: number;
  leaseToken: string | null;
}

export interface StaleDecision {
  isStale: boolean;
  reason: string;
}

/** Default heartbeat grace: 45 minutes (see CLAIM-LEASE-HEARTBEAT.md). */
export const DEFAULT_HEARTBEAT_GRACE_MS = 45 * 60 * 1000;

/** Default lease duration for implementation work: 4 hours. */
export const DEFAULT_LEASE_MS = 4 * 60 * 60 * 1000;

export function isActiveOwnership(status: LeaseStatus): boolean {
  return (ACTIVE_OWNERSHIP_STATUSES as readonly string[]).includes(status);
}

export function canClaim(status: LeaseStatus): boolean {
  return (CLAIMABLE_STATUSES as readonly string[]).includes(status);
}

export function canReclaim(status: LeaseStatus): boolean {
  return (RECLAIMABLE_STATUSES as readonly string[]).includes(status);
}

/**
 * A task is STALE when:
 * - it is in an active ownership status, AND
 * - lease_expiry is in the past, AND
 * - last_heartbeat is older than now - heartbeat_grace
 *
 * Both conditions are required so a late-but-still-within-grace heartbeat
 * does not immediately orphan work while the lease clock has ticked over.
 */
export function evaluateStale(
  snapshot: LeaseSnapshot,
  now: Date = new Date(),
  heartbeatGraceMs: number = DEFAULT_HEARTBEAT_GRACE_MS,
): StaleDecision {
  if (!isActiveOwnership(snapshot.status)) {
    return { isStale: false, reason: `status ${snapshot.status} is not active ownership` };
  }
  if (!snapshot.leaseExpiry) {
    return { isStale: false, reason: "no lease_expiry set" };
  }
  if (!snapshot.lastHeartbeat) {
    return { isStale: false, reason: "no last_heartbeat set" };
  }
  if (snapshot.leaseExpiry.getTime() >= now.getTime()) {
    return { isStale: false, reason: "lease still valid" };
  }
  const graceDeadline = snapshot.lastHeartbeat.getTime() + heartbeatGraceMs;
  if (graceDeadline >= now.getTime()) {
    return {
      isStale: false,
      reason: "within heartbeat grace after lease expiry",
    };
  }
  return {
    isStale: true,
    reason: "lease expired and heartbeat grace exceeded",
  };
}

/**
 * Heartbeat is accepted only when the caller is the current owner,
 * the task is in an active ownership status, and the lease has not expired.
 * (Sliding extension is applied by the DB function on success.)
 */
export function canHeartbeat(
  snapshot: LeaseSnapshot,
  requestedOwner: string,
  now: Date = new Date(),
): { ok: boolean; reason: string } {
  if (!requestedOwner || requestedOwner.trim() === "") {
    return { ok: false, reason: "owner is required" };
  }
  if (snapshot.owner !== requestedOwner) {
    return { ok: false, reason: "owner mismatch" };
  }
  if (!isActiveOwnership(snapshot.status)) {
    return { ok: false, reason: `status ${snapshot.status} does not accept heartbeat` };
  }
  if (!snapshot.leaseExpiry || snapshot.leaseExpiry.getTime() <= now.getTime()) {
    return { ok: false, reason: "lease expired; mark STALE then reclaim" };
  }
  return { ok: true, reason: "heartbeat accepted" };
}

/**
 * Two concurrent claim attempts against READY: only one UPDATE wins.
 * This pure helper documents the expected outcome for tests.
 */
export function resolveClaimRace(
  firstClaimant: string,
  secondClaimant: string,
): { winner: string; loser: string } {
  // DB serializes the UPDATEs; the first committed transaction wins.
  // We do not order by name — tests assert mutual exclusion, not ordering.
  return { winner: firstClaimant, loser: secondClaimant };
}

/**
 * Release is allowed only for the current owner while in active ownership.
 */
export function canRelease(
  snapshot: LeaseSnapshot,
  requestedOwner: string,
): { ok: boolean; reason: string } {
  if (!requestedOwner || requestedOwner.trim() === "") {
    return { ok: false, reason: "owner is required" };
  }
  if (snapshot.owner !== requestedOwner) {
    return { ok: false, reason: "owner mismatch" };
  }
  if (!isActiveOwnership(snapshot.status)) {
    return { ok: false, reason: `status ${snapshot.status} cannot be released` };
  }
  return { ok: true, reason: "release accepted" };
}


/** Every owner mutation must present the exact current fencing generation and token. */
export function canFence(
  snapshot: LeaseSnapshot,
  requestedGeneration: number,
  requestedToken: string,
): { ok: boolean; reason: string } {
  if (!Number.isSafeInteger(requestedGeneration) || requestedGeneration < 1) {
    return { ok: false, reason: "lease generation is required" };
  }
  if (!requestedToken || requestedToken.trim() === "") {
    return { ok: false, reason: "lease token is required" };
  }
  if (snapshot.leaseGeneration !== requestedGeneration) {
    return { ok: false, reason: "lease generation mismatch" };
  }
  if (snapshot.leaseToken !== requestedToken) {
    return { ok: false, reason: "lease token mismatch" };
  }
  return { ok: true, reason: "lease fence accepted" };
}
