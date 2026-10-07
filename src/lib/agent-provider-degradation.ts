/**
 * Provider degradation policy — pure functions.
 * When a provider fails, decide retry / alternate / human fallback.
 */

export type DegradationAction = "retry_once" | "alternate_provider" | "human_fallback";

export interface ProviderFailureContext {
  consecutiveFailures: number;
  lastErrorClass: "timeout" | "auth" | "rate_limit" | "malformed" | "unknown";
  alternateAvailable: boolean;
  riskCeiling: "low" | "medium" | "high" | "critical";
}

export function chooseDegradationAction(ctx: ProviderFailureContext): DegradationAction {
  if (ctx.lastErrorClass === "auth") return "human_fallback";
  if (ctx.consecutiveFailures >= 3) {
    return ctx.alternateAvailable ? "alternate_provider" : "human_fallback";
  }
  if (ctx.lastErrorClass === "rate_limit" && ctx.alternateAvailable) {
    return "alternate_provider";
  }
  if (ctx.consecutiveFailures === 1 && ctx.lastErrorClass === "timeout") {
    return "retry_once";
  }
  if (ctx.riskCeiling === "critical" || ctx.riskCeiling === "high") {
    return "human_fallback";
  }
  return ctx.alternateAvailable ? "alternate_provider" : "retry_once";
}

export function shouldQueueForHuman(action: DegradationAction): boolean {
  return action === "human_fallback";
}
