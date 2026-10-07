/**
 * Company-level lifecycle for the Living World engineering organisation.
 * Pure functions only — no side effects, no persistence, no provider calls.
 */

export type OrganisationLifecycle =
  | "PROPOSED"
  | "SPECIFIED"
  | "EVALUATING"
  | "ACTIVE"
  | "DEGRADED"
  | "SUSPENDED"
  | "RETIRED";

export type LifecycleTransition = {
  from: OrganisationLifecycle;
  to: OrganisationLifecycle;
  reason: string;
};

const ALLOWED: Record<OrganisationLifecycle, OrganisationLifecycle[]> = {
  PROPOSED: ["SPECIFIED", "RETIRED"],
  SPECIFIED: ["EVALUATING", "RETIRED"],
  EVALUATING: ["ACTIVE", "RETIRED"],
  ACTIVE: ["DEGRADED", "SUSPENDED", "RETIRED"],
  DEGRADED: ["ACTIVE", "SUSPENDED", "RETIRED"],
  SUSPENDED: ["ACTIVE", "DEGRADED", "RETIRED"],
  RETIRED: [],
};

export function canTransitionLifecycle(
  from: OrganisationLifecycle,
  to: OrganisationLifecycle,
): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export type HealthSignal = {
  failingProviders: number;
  staleTasks: number;
  openP0: number;
  consecutiveProviderFailures: number;
};

export type HealthEvaluation = {
  status: "healthy" | "degraded" | "critical";
  recommendSuspend: boolean;
  reasons: string[];
};

export function evaluateHealth(signal: HealthSignal): HealthEvaluation {
  const reasons: string[] = [];
  if (signal.openP0 > 0) reasons.push(`${signal.openP0} open P0 findings`);
  if (signal.staleTasks > 3) reasons.push(`${signal.staleTasks} stale tasks`);
  if (signal.failingProviders > 1) reasons.push(`${signal.failingProviders} failing providers`);
  if (signal.consecutiveProviderFailures >= 3)
    reasons.push(`${signal.consecutiveProviderFailures} consecutive provider failures`);

  const critical =
    signal.openP0 > 0 || signal.consecutiveProviderFailures >= 5 || signal.failingProviders >= 3;
  const degraded = reasons.length > 0;

  return {
    status: critical ? "critical" : degraded ? "degraded" : "healthy",
    recommendSuspend: critical,
    reasons,
  };
}

export function shouldSuspendRouting(evaluation: HealthEvaluation): boolean {
  return evaluation.recommendSuspend;
}
