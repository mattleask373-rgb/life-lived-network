/**
 * Authoritative task lifecycle for the agent control plane.
 * Canonical documentation: docs/agents/STATE-MACHINE.md
 *
 * This module is the pure-policy source of truth for legal transitions.
 * The SQL function public.transition_agent_task must enforce the same rules.
 */

import type { LeaseStatus } from "./agent-lease-policy";
import { isActiveOwnership } from "./agent-lease-policy";

export type TaskStatus = LeaseStatus;

export type TransitionActorRole =
  | "owner" // current lease owner / implementer
  | "reviewer" // independent reviewer (must ≠ owner)
  | "system" // mark_stale, orchestrator recovery
  | "human" // human gate only
  | "any_agent"; // triage / block from non-ownership states

export interface TransitionRule {
  from: TaskStatus;
  to: TaskStatus;
  actor: TransitionActorRole;
  /** Require matching owner + valid lease (lease_expiry > now). */
  requiresLiveLease: boolean;
  /**
   * When true, SQL renews lease_start/expiry/heartbeat on success
   * (used for CHANGES_REQUESTED → IN_PROGRESS after review lag).
   */
  renewsLease: boolean;
  /** Human-readable evidence expectation (enforced at policy level). */
  evidenceHint: string;
  /** If true, actor identity must not equal task.owner. */
  forbidSelfApproval: boolean;
}

/**
 * Legal transitions only. Anything not listed is illegal.
 * Claim/reclaim/stale/release remain available via dedicated lease RPCs;
 * this table covers status progression and exceptional paths.
 */
export const LEGAL_TRANSITIONS: readonly TransitionRule[] = [
  {
    from: "CLAIMED",
    to: "IN_PROGRESS",
    actor: "owner",
    requiresLiveLease: true,
    renewsLease: false,
    evidenceHint: "branch or files touched",
    forbidSelfApproval: false,
  },
  {
    from: "IN_PROGRESS",
    to: "VERIFYING",
    actor: "owner",
    requiresLiveLease: true,
    renewsLease: false,
    evidenceHint: "handoff draft + tests intended",
    forbidSelfApproval: false,
  },
  {
    from: "VERIFYING",
    to: "REVIEW",
    actor: "owner",
    requiresLiveLease: true,
    renewsLease: false,
    evidenceHint: "test/lint/build results",
    forbidSelfApproval: false,
  },
  {
    from: "REVIEW",
    to: "ACCEPTED",
    actor: "reviewer",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "review notes + checklist",
    forbidSelfApproval: true,
  },
  {
    from: "REVIEW",
    to: "CHANGES_REQUESTED",
    actor: "reviewer",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "specific findings",
    forbidSelfApproval: true,
  },
  {
    from: "CHANGES_REQUESTED",
    to: "IN_PROGRESS",
    actor: "owner",
    requiresLiveLease: false,
    renewsLease: true,
    evidenceHint: "response to findings",
    forbidSelfApproval: false,
  },
  {
    from: "ACCEPTED",
    to: "INTEGRATED",
    actor: "human",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "merge evidence",
    forbidSelfApproval: false,
  },
  {
    from: "CLAIMED",
    to: "BLOCKED",
    actor: "owner",
    requiresLiveLease: true,
    renewsLease: false,
    evidenceHint: "blocker template",
    forbidSelfApproval: false,
  },
  {
    from: "IN_PROGRESS",
    to: "BLOCKED",
    actor: "owner",
    requiresLiveLease: true,
    renewsLease: false,
    evidenceHint: "blocker template",
    forbidSelfApproval: false,
  },
  {
    from: "VERIFYING",
    to: "BLOCKED",
    actor: "owner",
    requiresLiveLease: true,
    renewsLease: false,
    evidenceHint: "blocker template",
    forbidSelfApproval: false,
  },
  {
    from: "BLOCKED",
    to: "READY",
    actor: "any_agent",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "blocker cleared",
    forbidSelfApproval: false,
  },
  {
    from: "CLAIMED",
    to: "STALE",
    actor: "system",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "lease expiry + heartbeat grace",
    forbidSelfApproval: false,
  },
  {
    from: "IN_PROGRESS",
    to: "STALE",
    actor: "system",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "lease expiry + heartbeat grace",
    forbidSelfApproval: false,
  },
  {
    from: "VERIFYING",
    to: "STALE",
    actor: "system",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "lease expiry + heartbeat grace",
    forbidSelfApproval: false,
  },
  {
    from: "STALE",
    to: "ABANDONED",
    actor: "any_agent",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "inspection notes",
    forbidSelfApproval: false,
  },
  {
    from: "ABANDONED",
    to: "READY",
    actor: "any_agent",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "re-open decision",
    forbidSelfApproval: false,
  },
] as const;

export interface TransitionRequest {
  from: TaskStatus;
  to: TaskStatus;
  actorId: string;
  /** Current task owner (implementer). */
  owner: string | null;
  /** True when lease_expiry > now AND status is active ownership. */
  leaseValid: boolean;
  /** Optional reviewer id when advancing from REVIEW. */
  reviewerId?: string | null;
}

export interface TransitionDecision {
  allowed: boolean;
  reason: string;
  rule?: TransitionRule;
}

function roleMatches(
  rule: TransitionRule,
  req: TransitionRequest,
): { ok: boolean; reason: string } {
  const actor = req.actorId?.trim() ?? "";
  if (!actor) {
    return { ok: false, reason: "actor is required" };
  }

  switch (rule.actor) {
    case "owner":
      if (req.owner !== actor) {
        return { ok: false, reason: "actor is not the current owner" };
      }
      return { ok: true, reason: "owner match" };
    case "reviewer": {
      if (rule.forbidSelfApproval && req.owner && req.owner === actor) {
        return {
          ok: false,
          reason: "self-approval forbidden: implementer cannot accept own work",
        };
      }
      return { ok: true, reason: "independent reviewer" };
    }
    case "human":
      if (actor !== "human" && !actor.startsWith("human:")) {
        return { ok: false, reason: "INTEGRATED requires human actor" };
      }
      return { ok: true, reason: "human gate" };
    case "system":
      if (actor !== "system" && !actor.startsWith("system:")) {
        return { ok: false, reason: "system actor required" };
      }
      return { ok: true, reason: "system" };
    case "any_agent":
      return { ok: true, reason: "any agent" };
    default:
      return { ok: false, reason: "unknown actor role" };
  }
}

/**
 * Decide whether a status transition is legal under the authoritative table.
 * Does not perform I/O. Claim/reclaim/release use dedicated lease RPCs.
 */
export function evaluateTransition(req: TransitionRequest): TransitionDecision {
  if (req.from === req.to) {
    return { allowed: false, reason: "no-op transition is not recorded" };
  }

  const rule = LEGAL_TRANSITIONS.find((r) => r.from === req.from && r.to === req.to);
  if (!rule) {
    return {
      allowed: false,
      reason: `illegal transition ${req.from} → ${req.to}`,
    };
  }

  const role = roleMatches(rule, req);
  if (!role.ok) {
    return { allowed: false, reason: role.reason, rule };
  }

  if (rule.requiresLiveLease && !req.leaseValid) {
    return {
      allowed: false,
      reason: "live lease required; mark STALE and reclaim if expired",
      rule,
    };
  }

  if (rule.forbidSelfApproval && req.owner && req.owner === req.actorId) {
    return {
      allowed: false,
      reason: "self-approval forbidden",
      rule,
    };
  }

  return { allowed: true, reason: "transition allowed", rule };
}

/** All destinations reachable from a given status (for docs/tests). */
export function allowedDestinations(from: TaskStatus): TaskStatus[] {
  return LEGAL_TRANSITIONS.filter((r) => r.from === from).map((r) => r.to);
}

/**
 * Provider execution outcomes map into control-plane transitions.
 * Providers never write ACCEPTED or INTEGRATED.
 */
export function providerOutcomeToTransition(
  outcome: "VERIFYING" | "BLOCKED" | "CHANGES_REQUESTED" | "FAILED" | "PARTIAL",
  current: TaskStatus,
): TaskStatus | null {
  switch (outcome) {
    case "VERIFYING":
      if (current === "IN_PROGRESS" || current === "CLAIMED") return "VERIFYING";
      return null;
    case "BLOCKED":
      if (isActiveOwnership(current)) return "BLOCKED";
      return null;
    case "CHANGES_REQUESTED":
      return null;
    case "FAILED":
    case "PARTIAL":
      if (isActiveOwnership(current)) return "IN_PROGRESS";
      return null;
    default:
      return null;
  }
}
