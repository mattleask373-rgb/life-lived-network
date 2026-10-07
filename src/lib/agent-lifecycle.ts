/**
 * Specialist instance lifecycle and health.
 * ACTIVE is not the same as HEALTHY.
 */

export type AgentLifecycleState =
  | "PROPOSED"
  | "SPECIFIED"
  | "EVALUATING"
  | "ACTIVE"
  | "DEGRADED"
  | "SUSPENDED"
  | "RETIRED";

export type AgentHealth = "HEALTHY" | "DEGRADED" | "FAILING" | "UNKNOWN";

export interface AgentHealthSignals {
  recentFailures: number;
  recentReviewRejections: number;
  malformedHandoffs: number;
  scopeViolations: number;
  evidenceViolations: number;
}

export interface AgentInstanceRecord {
  identity: string;
  roleId: string;
  projectId: string;
  lifecycle: AgentLifecycleState;
  health: AgentHealth;
  version: string;
  owner: string;
}

const LIFECYCLE_ORDER: AgentLifecycleState[] = [
  "PROPOSED",
  "SPECIFIED",
  "EVALUATING",
  "ACTIVE",
  "DEGRADED",
  "SUSPENDED",
  "RETIRED",
];

export function canTransitionLifecycle(
  from: AgentLifecycleState,
  to: AgentLifecycleState,
): boolean {
  if (from === to) return false;
  if (to === "RETIRED") return from !== "RETIRED";
  if (from === "RETIRED") return false;
  if (from === "SUSPENDED" && (to === "ACTIVE" || to === "DEGRADED" || to === "RETIRED")) {
    return true;
  }
  if (from === "ACTIVE" && (to === "DEGRADED" || to === "SUSPENDED" || to === "RETIRED")) {
    return true;
  }
  if (from === "DEGRADED" && (to === "ACTIVE" || to === "SUSPENDED" || to === "RETIRED")) {
    return true;
  }
  const fi = LIFECYCLE_ORDER.indexOf(from);
  const ti = LIFECYCLE_ORDER.indexOf(to);
  // Forward-only along the early chain
  if (fi >= 0 && ti >= 0 && ti === fi + 1 && ti <= LIFECYCLE_ORDER.indexOf("ACTIVE")) {
    return true;
  }
  return false;
}

export function evaluateHealth(signals: AgentHealthSignals): AgentHealth {
  if (
    signals.scopeViolations > 0 ||
    signals.evidenceViolations >= 3 ||
    signals.recentFailures >= 5
  ) {
    return "FAILING";
  }
  if (
    signals.recentFailures >= 2 ||
    signals.recentReviewRejections >= 2 ||
    signals.malformedHandoffs >= 2
  ) {
    return "DEGRADED";
  }
  if (
    signals.recentFailures === 0 &&
    signals.recentReviewRejections === 0 &&
    signals.malformedHandoffs === 0 &&
    signals.scopeViolations === 0 &&
    signals.evidenceViolations === 0
  ) {
    return "HEALTHY";
  }
  return "UNKNOWN";
}

export function shouldSuspendRouting(health: AgentHealth): boolean {
  return health === "FAILING";
}
