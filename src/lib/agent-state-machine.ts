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

export type TransitionActorRole = "owner" | "reviewer" | "system" | "human" | "any_agent";

export interface TransitionRule {
  from: TaskStatus;
  to: TaskStatus;
  actor: TransitionActorRole;
  requiresLiveLease: boolean;
  renewsLease: boolean;
  evidenceHint: string;
  forbidSelfApproval: boolean;
}

/**
 * Legal transitions only. Anything not listed is illegal.
 * Claim/reclaim/stale/release remain available via dedicated lease RPCs.
 * DONE is never a legal destination.
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
  // CANCELLED — owner for active work; human for queue/side states
  {
    from: "CLAIMED",
    to: "CANCELLED",
    actor: "owner",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "cancellation reason",
    forbidSelfApproval: false,
  },
  {
    from: "IN_PROGRESS",
    to: "CANCELLED",
    actor: "owner",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "cancellation reason",
    forbidSelfApproval: false,
  },
  {
    from: "VERIFYING",
    to: "CANCELLED",
    actor: "owner",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "cancellation reason",
    forbidSelfApproval: false,
  },
  {
    from: "CHANGES_REQUESTED",
    to: "CANCELLED",
    actor: "owner",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "cancellation reason",
    forbidSelfApproval: false,
  },
  {
    from: "READY",
    to: "CANCELLED",
    actor: "human",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "cancellation reason",
    forbidSelfApproval: false,
  },
  {
    from: "BLOCKED",
    to: "CANCELLED",
    actor: "human",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "cancellation reason",
    forbidSelfApproval: false,
  },
  {
    from: "STALE",
    to: "CANCELLED",
    actor: "human",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "cancellation reason",
    forbidSelfApproval: false,
  },
  {
    from: "REVIEW",
    to: "CANCELLED",
    actor: "human",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "cancellation reason",
    forbidSelfApproval: false,
  },
  {
    from: "ABANDONED",
    to: "CANCELLED",
    actor: "human",
    requiresLiveLease: false,
    renewsLease: false,
    evidenceHint: "cancellation reason",
    forbidSelfApproval: false,
  },
] as const;

export interface TransitionRequest {
  from: TaskStatus;
  to: TaskStatus;
  actorId: string;
  owner: string | null;
  leaseValid: boolean;
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
        return { ok: false, reason: "human actor required" };
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

export function evaluateTransition(req: TransitionRequest): TransitionDecision {
  if (req.from === req.to) {
    return { allowed: false, reason: "no-op transition is not recorded" };
  }

  if (req.to === "DONE") {
    return {
      allowed: false,
      reason: "DONE is legacy-only and not a legal transition destination",
    };
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

export function allowedDestinations(from: TaskStatus): TaskStatus[] {
  return LEGAL_TRANSITIONS.filter((r) => r.from === from).map((r) => r.to);
}

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
