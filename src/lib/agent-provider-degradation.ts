/**
 * Provider failure / degradation policy.
 * Never retry forever; never lower safety standards.
 */

export type ProviderFailureKind =
  | "unavailable"
  | "timeout"
  | "rate_limited"
  | "invalid_result"
  | "contract_violation"
  | "insufficient_evidence"
  | "conflicting_evidence"
  | "repeated_failure"
  | "cost_exceeded"
  | "unreliable";

export type DegradationAction = "retry_once" | "alternate_provider" | "human_fallback" | "blocked";

export interface FailureContext {
  kind: ProviderFailureKind;
  consecutiveFailures: number;
  alternateAvailable: boolean;
  humanAvailable: boolean;
  isDeterministicFailure: boolean;
}

export function nextDegradationAction(ctx: FailureContext): DegradationAction {
  if (ctx.kind === "contract_violation" || ctx.kind === "insufficient_evidence") {
    return ctx.alternateAvailable ? "alternate_provider" : "blocked";
  }
  if (ctx.isDeterministicFailure) {
    return ctx.alternateAvailable ? "alternate_provider" : "blocked";
  }
  if (ctx.consecutiveFailures >= 3) {
    if (ctx.alternateAvailable) return "alternate_provider";
    if (ctx.humanAvailable) return "human_fallback";
    return "blocked";
  }
  if (ctx.kind === "timeout" || ctx.kind === "rate_limited" || ctx.kind === "unavailable") {
    if (ctx.consecutiveFailures === 0) return "retry_once";
    if (ctx.alternateAvailable) return "alternate_provider";
    if (ctx.humanAvailable) return "human_fallback";
    return "blocked";
  }
  if (ctx.alternateAvailable) return "alternate_provider";
  if (ctx.humanAvailable) return "human_fallback";
  return "blocked";
}
