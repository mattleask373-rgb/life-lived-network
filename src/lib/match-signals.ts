import { freshness, isCurrent, type FreshnessState } from "./capability-freshness";
import type { Capability, VerificationState } from "./capability";
import type { Need } from "./needs";
import type { MatchSignal, SupplyConfidence, SupplyConstraint, SupplyTrust } from "./possibility-supply";

export function matchTerms(text: string, terms: string[]): string | null {
  const value = text.toLowerCase();
  return terms.find((term) => value.includes(term)) ?? null;
}

export function needTerms(need: Need): string[] {
  return [...new Set([need.category, need.title, ...need.requiredSkills, ...need.requiredRoles].join(" ").toLowerCase().split(/[^a-zà-ÿ]+/).filter((word) => word.length > 3))];
}

export function capabilityState(capability: Capability, now: string | number | Date): FreshnessState {
  return freshness({ lastConfirmedAt: capability.lastConfirmedAt, expiresAt: capability.expiresOn, kind: "capability", now });
}

export function usableCapability(capability: Capability, now: string | number | Date): boolean {
  return capability.visibility !== "private" && isCurrent(capabilityState(capability, now));
}

export function confidence(signals: MatchSignal[]): SupplyConfidence {
  const basis = signals.filter((s) => s.strength !== "unknown").map((s) => s.reason);
  const required = signals.filter((s) => s.strength === "required").length;
  return { level: required >= 3 ? "strong" : required >= 1 ? "supported" : "possible", basis };
}

export function trust(verification: VerificationState | "not_applicable"): SupplyTrust {
  return { verification, label: verification === "qualification_checked" || verification === "checked" ? "Checked evidence" : verification === "not_applicable" ? "No personal claim" : "Not independently checked", reviewed: verification === "qualification_checked" || verification === "checked" };
}

export function constraints(passed: string[], unknown: string[]): SupplyConstraint[] {
  return [...passed.map((reason) => ({ kind: reason, state: "passed" as const, reason })), ...unknown.map((reason) => ({ kind: reason, state: "unknown" as const, reason }))];
}
