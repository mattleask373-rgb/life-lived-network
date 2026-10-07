/**
 * Agent/provider evaluation schema — instrumentation only.
 * Do not fabricate live metrics.
 */

export interface EvaluationCounters {
  tasksAttempted: number;
  tasksSucceeded: number;
  verificationPasses: number;
  verificationFails: number;
  reworkCount: number;
  blockedCount: number;
  staleCount: number;
  humanInterventions: number;
  reviewDisagreements: number;
  evidenceViolations: number;
}

export interface EvaluationWindow {
  projectId: string;
  subjectType: "agent" | "provider" | "role";
  subjectId: string;
  fromIso: string;
  toIso: string;
  counters: EvaluationCounters;
  /** Explicit: data completeness */
  dataQuality: "empty" | "partial" | "complete";
}

export function emptyCounters(): EvaluationCounters {
  return {
    tasksAttempted: 0,
    tasksSucceeded: 0,
    verificationPasses: 0,
    verificationFails: 0,
    reworkCount: 0,
    blockedCount: 0,
    staleCount: 0,
    humanInterventions: 0,
    reviewDisagreements: 0,
    evidenceViolations: 0,
  };
}

export function successRate(c: EvaluationCounters): number | null {
  if (c.tasksAttempted === 0) return null;
  return c.tasksSucceeded / c.tasksAttempted;
}
