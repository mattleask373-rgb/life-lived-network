/**
 * Agent Factory — spawn specialist role contracts from templates.
 * Adding a specialist should be configuration + tests, not bespoke engineering.
 */

import type {
  AgentRoleContract,
  HumanGate,
  RoleCapability,
  SpecialistRoleId,
} from "./agent-role-contract";
import type { AutonomyLevel, RiskLevel } from "./agent-orchestration";

export interface RoleTemplateInput {
  id: SpecialistRoleId | (string & {});
  displayName: string;
  owns: string[];
  mustNot?: string[];
  capabilities: RoleCapability[];
  maxAutonomy?: AutonomyLevel;
  maxRiskWithoutHumanGate?: RiskLevel;
  defaultScopeIn?: string[];
  defaultScopeOut?: string[];
  requiresIndependentReview?: boolean;
  humanGates?: HumanGate[];
  evidenceRequired?: string[];
  defaultLeaseMinutes?: number;
}

export type FactoryValidationIssue =
  | { code: "MISSING_ID"; message: string }
  | { code: "MISSING_NAME"; message: string }
  | { code: "NO_CAPABILITIES"; message: string }
  | { code: "NO_OWNS"; message: string }
  | { code: "SELF_ACCEPT_FORBIDDEN"; message: string }
  | { code: "LEASE_OUT_OF_RANGE"; message: string };

const DEFAULT_MUST_NOT = [
  "merge to main autonomously",
  "self-accept own implementation",
  "fabricate evidence",
  "promote UNKNOWN to confirmed",
];

export function validateRoleTemplate(input: RoleTemplateInput): FactoryValidationIssue[] {
  const issues: FactoryValidationIssue[] = [];
  if (!input.id || String(input.id).trim() === "") {
    issues.push({ code: "MISSING_ID", message: "role id is required" });
  }
  if (!input.displayName || input.displayName.trim() === "") {
    issues.push({ code: "MISSING_NAME", message: "displayName is required" });
  }
  if (!input.capabilities || input.capabilities.length === 0) {
    issues.push({ code: "NO_CAPABILITIES", message: "at least one capability is required" });
  }
  if (!input.owns || input.owns.length === 0) {
    issues.push({ code: "NO_OWNS", message: "owns must list at least one responsibility" });
  }
  const lease = input.defaultLeaseMinutes ?? 180;
  if (lease < 1 || lease > 1440) {
    issues.push({ code: "LEASE_OUT_OF_RANGE", message: "defaultLeaseMinutes must be 1..1440" });
  }
  return issues;
}

/**
 * Create a role contract from a template.
 * canAcceptOwnWork is always false — factory never creates self-approving roles.
 */
export function createRoleFromTemplate(input: RoleTemplateInput): AgentRoleContract {
  const issues = validateRoleTemplate(input);
  if (issues.length > 0) {
    throw new Error(`Invalid role template: ${issues.map((i) => i.code).join(", ")}`);
  }

  return {
    id: input.id as SpecialistRoleId,
    displayName: input.displayName.trim(),
    owns: [...input.owns],
    mustNot: [...DEFAULT_MUST_NOT, ...(input.mustNot ?? [])],
    capabilities: [...input.capabilities],
    maxAutonomy: input.maxAutonomy ?? "L2",
    maxRiskWithoutHumanGate: input.maxRiskWithoutHumanGate ?? "P2",
    defaultScopeIn: input.defaultScopeIn ?? [],
    defaultScopeOut: input.defaultScopeOut ?? ["main"],
    requiresIndependentReview: input.requiresIndependentReview ?? true,
    canAcceptOwnWork: false,
    humanGates: input.humanGates ?? [],
    evidenceRequired: input.evidenceRequired ?? ["handoff", "evidence"],
    defaultLeaseMinutes: input.defaultLeaseMinutes ?? 180,
  };
}

export function registerRole(
  roster: readonly AgentRoleContract[],
  role: AgentRoleContract,
): AgentRoleContract[] {
  if (roster.some((r) => r.id === role.id)) {
    throw new Error(`Role already registered: ${role.id}`);
  }
  if (role.canAcceptOwnWork) {
    throw new Error("SELF_ACCEPT_FORBIDDEN: factory rejects canAcceptOwnWork=true");
  }
  return [...roster, role];
}
