/**
 * Priority scoring for candidate/executable work.
 * Priority never bypasses safety gates.
 */

import type { RiskLevel } from "./agent-orchestration";

export interface PriorityInput {
  risk: RiskLevel;
  urgency: 0 | 1 | 2 | 3;
  customerImpact: 0 | 1 | 2 | 3;
  blockingOthers: boolean;
  ageHours: number;
  securitySeverity: 0 | 1 | 2 | 3;
  humanDeadlineHours: number | null;
}

const RISK_SCORE: Record<RiskLevel, number> = { P0: 40, P1: 25, P2: 10, P3: 0 };

export function scorePriority(input: PriorityInput): number {
  let score = RISK_SCORE[input.risk];
  score += input.urgency * 8;
  score += input.customerImpact * 6;
  score += input.securitySeverity * 12;
  if (input.blockingOthers) score += 15;
  score += Math.min(20, Math.floor(input.ageHours / 6));
  if (input.humanDeadlineHours !== null && input.humanDeadlineHours <= 24) {
    score += 20;
  }
  return score;
}

/** Explicit: high priority does not waive human/security gates. */
export function priorityWaivesSafetyGates(_score: number): false {
  return false;
}
