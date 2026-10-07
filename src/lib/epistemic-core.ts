/**
 * Shared epistemic core — one vocabulary for AI-native contracts.
 *
 * Downstream kernels (experiment, expansion, frontier, reflection, reality-delta)
 * should converge on these types rather than redefining parallel unions.
 *
 * Does not grant authority. Does not invent facts. Does not execute work.
 */

export type EpistemicClass =
  | "REAL"
  | "PLAUSIBLE"
  | "EXPERIMENTAL"
  | "SPECULATIVE"
  | "IMAGINED"
  | "UNKNOWN";

export type RiskClass = "low" | "medium" | "high" | "critical";

export interface EvidenceRef {
  id: string;
  source: string;
  locator?: string;
}

export interface EpistemicValidation {
  valid: boolean;
  errors: string[];
}

const EPISTEMIC = new Set<EpistemicClass>([
  "REAL",
  "PLAUSIBLE",
  "EXPERIMENTAL",
  "SPECULATIVE",
  "IMAGINED",
  "UNKNOWN",
]);

const RISKS = new Set<RiskClass>(["low", "medium", "high", "critical"]);

export function isEpistemicClass(value: unknown): value is EpistemicClass {
  return typeof value === "string" && EPISTEMIC.has(value as EpistemicClass);
}

export function isRiskClass(value: unknown): value is RiskClass {
  return typeof value === "string" && RISKS.has(value as RiskClass);
}

/** High/critical or irreversible work always requires a human gate. */
export function requiresHumanGate(risk: RiskClass, reversible: boolean): boolean {
  return !reversible || risk === "high" || risk === "critical";
}

/**
 * REAL claims require non-empty evidence.
 * UNKNOWN must not be treated as a positive world claim.
 */
export function validateEpistemicClaim(input: {
  epistemic: EpistemicClass;
  evidenceCount: number;
  assertingWorldFact?: boolean;
}): EpistemicValidation {
  const errors: string[] = [];
  if (!isEpistemicClass(input.epistemic)) errors.push("invalid epistemic class");
  if (input.epistemic === "REAL" && input.evidenceCount <= 0) {
    errors.push("REAL requires evidence");
  }
  if (input.assertingWorldFact && input.epistemic === "UNKNOWN") {
    errors.push("UNKNOWN cannot assert a world fact");
  }
  if (input.assertingWorldFact && input.epistemic === "IMAGINED") {
    errors.push("IMAGINED cannot assert a world fact");
  }
  return { valid: errors.length === 0, errors };
}

export function validateEvidenceRefs(value: unknown): EpistemicValidation {
  if (!Array.isArray(value)) return { valid: false, errors: ["evidence must be an array"] };
  const errors: string[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      errors.push("evidence item must be an object");
      continue;
    }
    const ref = item as EvidenceRef;
    if (typeof ref.id !== "string" || !ref.id.trim()) errors.push("evidence id required");
    if (typeof ref.source !== "string" || !ref.source.trim())
      errors.push("evidence source required");
  }
  return { valid: errors.length === 0, errors };
}
