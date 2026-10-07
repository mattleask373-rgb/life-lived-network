/**
 * Capability registry: Role ≠ Capability ≠ Permission ≠ Provider ≠ Autonomy.
 * Foundation for Agent Factory and routing.
 */

import type { AutonomyLevel, RiskLevel } from "./agent-orchestration";

export type PermissionId =
  | "read_repository"
  | "write_repository"
  | "create_tasks"
  | "write_analysis"
  | "read_research_sources"
  | "run_tests"
  | "open_pr"
  | "comment_on_pr"
  | "read_ci"
  | "propose_migration"
  | "publish_external"
  | "spend_money"
  | "modify_production"
  | "merge_main"
  | "manage_secrets";

export type FineCapabilityId =
  | "search_intent_analysis"
  | "competitor_analysis"
  | "technical_seo_analysis"
  | "content_opportunity_mapping"
  | "evidence_synthesis"
  | "threat_modelling"
  | "dependency_audit"
  | "adversarial_qa"
  | "regression_analysis"
  | "architecture_review"
  | "requirements_analysis"
  | "experiment_design"
  | "incident_triage"
  | "cost_analysis"
  | "agent_evaluation"
  | "handoff_audit"
  | "fact_check";

export interface CapabilityDefinition {
  id: FineCapabilityId;
  description: string;
  defaultPermissions: PermissionId[];
  prohibitedPermissions: PermissionId[];
  minEvidence: string[];
}

export interface AgentPermissionEnvelope {
  allow: PermissionId[];
  deny: PermissionId[];
}

/** Hard denies that no specialist may self-grant. */
export const GLOBAL_DENIED_PERMISSIONS: readonly PermissionId[] = [
  "merge_main",
  "modify_production",
  "manage_secrets",
  "spend_money",
  "publish_external",
] as const;

export const CAPABILITY_CATALOG: readonly CapabilityDefinition[] = [
  {
    id: "search_intent_analysis",
    description: "Map queries and intent for SEO/content",
    defaultPermissions: ["read_research_sources", "write_analysis", "create_tasks"],
    prohibitedPermissions: ["publish_external", "spend_money"],
    minEvidence: ["sources", "retrieval date", "confidence"],
  },
  {
    id: "competitor_analysis",
    description: "Structured competitor comparison",
    defaultPermissions: ["read_research_sources", "write_analysis"],
    prohibitedPermissions: ["publish_external"],
    minEvidence: ["sources", "date", "limitations"],
  },
  {
    id: "adversarial_qa",
    description: "Attempt to break claims and implementations",
    defaultPermissions: ["read_repository", "run_tests", "write_analysis"],
    prohibitedPermissions: ["merge_main"],
    minEvidence: ["repro steps", "severity", "test commands"],
  },
  {
    id: "threat_modelling",
    description: "Security threat modelling",
    defaultPermissions: ["read_repository", "write_analysis"],
    prohibitedPermissions: ["manage_secrets", "modify_production"],
    minEvidence: ["assets", "threats", "mitigations"],
  },
  {
    id: "fact_check",
    description: "Audit claims against sources",
    defaultPermissions: ["read_research_sources", "write_analysis"],
    prohibitedPermissions: [],
    minEvidence: ["claim", "sources", "verdict"],
  },
  {
    id: "agent_evaluation",
    description: "Score agent/provider performance from evidence records",
    defaultPermissions: ["read_ci", "write_analysis"],
    prohibitedPermissions: ["modify_production"],
    minEvidence: ["metrics definition", "sample window", "limitations"],
  },
  {
    id: "experiment_design",
    description: "Define measurable product/growth experiments",
    defaultPermissions: ["write_analysis", "create_tasks"],
    prohibitedPermissions: ["publish_external", "spend_money"],
    minEvidence: ["hypothesis", "success metric", "stop criteria"],
  },
] as const;

export function resolvePermissions(
  capabilities: FineCapabilityId[],
  extraAllow: PermissionId[] = [],
): AgentPermissionEnvelope {
  const allow = new Set<PermissionId>(extraAllow);
  const deny = new Set<PermissionId>(GLOBAL_DENIED_PERMISSIONS);

  for (const id of capabilities) {
    const def = CAPABILITY_CATALOG.find((c) => c.id === id);
    if (!def) continue;
    for (const p of def.defaultPermissions) allow.add(p);
    for (const p of def.prohibitedPermissions) deny.add(p);
  }

  // Global deny always wins — agents cannot self-grant forbidden permissions
  for (const d of GLOBAL_DENIED_PERMISSIONS) {
    deny.add(d);
    allow.delete(d);
  }
  for (const d of deny) allow.delete(d);

  return { allow: [...allow], deny: [...deny] };
}

export function assertPermission(
  envelope: AgentPermissionEnvelope,
  permission: PermissionId,
): { ok: boolean; reason: string } {
  if (envelope.deny.includes(permission)) {
    return { ok: false, reason: `permission denied: ${permission}` };
  }
  if (!envelope.allow.includes(permission)) {
    return { ok: false, reason: `permission not granted: ${permission}` };
  }
  if ((GLOBAL_DENIED_PERMISSIONS as readonly string[]).includes(permission)) {
    return { ok: false, reason: `global deny: ${permission}` };
  }
  return { ok: true, reason: "allowed" };
}

export interface SpecialistSpec {
  identity: string;
  roleId: string;
  mission: string;
  capabilities: FineCapabilityId[];
  permissions: AgentPermissionEnvelope;
  maxAutonomy: AutonomyLevel;
  maxRisk: RiskLevel;
  requiresIndependentReview: boolean;
  version: string;
}

export function buildSpecialistSpec(input: {
  identity: string;
  roleId: string;
  mission: string;
  capabilities: FineCapabilityId[];
  maxAutonomy?: AutonomyLevel;
  maxRisk?: RiskLevel;
  version?: string;
}): SpecialistSpec {
  const permissions = resolvePermissions(input.capabilities);
  return {
    identity: input.identity,
    roleId: input.roleId,
    mission: input.mission,
    capabilities: [...input.capabilities],
    permissions,
    maxAutonomy: input.maxAutonomy ?? "L2",
    maxRisk: input.maxRisk ?? "P2",
    requiresIndependentReview: true,
    version: input.version ?? "1",
  };
}
