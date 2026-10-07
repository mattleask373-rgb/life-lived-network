/**
 * Machine-readable specialist role contracts for the reusable AI team OS.
 * A role is a capability contract — not a hard-wired model vendor.
 *
 * Canonical narrative: docs/agents/TEAM-ROLES.md
 * Provider binding is policy-driven (see agent-provider.ts).
 */

import type { AutonomyLevel, RiskLevel } from "./agent-orchestration";

export type SpecialistRoleId =
  | "head_manager"
  | "product_strategy"
  | "architect"
  | "engineering_frontend"
  | "engineering_backend"
  | "engineering_database"
  | "engineering_integrations"
  | "qa_verification"
  | "security_privacy"
  | "research_intelligence"
  | "seo"
  | "marketing_growth"
  | "design_ux"
  | "documentation_knowledge"
  | "devops_release"
  | "analytics_learning"
  | "agent_factory";

export type RoleCapability =
  | "orchestrate"
  | "product"
  | "architecture"
  | "implementation"
  | "review"
  | "qa"
  | "security_audit"
  | "research"
  | "seo"
  | "marketing"
  | "design"
  | "documentation"
  | "devops"
  | "analytics"
  | "meta_agent";

export type HumanGate =
  | "main_merge"
  | "production_deploy"
  | "production_secrets"
  | "destructive_migration"
  | "architecture_invariant_change"
  | "privacy_model_change"
  | "regulated_behaviour"
  | "external_publication"
  | "paid_spend"
  | "irreversible_operation";

export interface AgentRoleContract {
  id: SpecialistRoleId;
  displayName: string;
  owns: string[];
  mustNot: string[];
  capabilities: RoleCapability[];
  maxAutonomy: AutonomyLevel;
  maxRiskWithoutHumanGate: RiskLevel;
  /** Paths this role may claim by default (glob-ish prefixes). Empty = any under policy. */
  defaultScopeIn: string[];
  defaultScopeOut: string[];
  requiresIndependentReview: boolean;
  canAcceptOwnWork: boolean;
  humanGates: HumanGate[];
  evidenceRequired: string[];
  defaultLeaseMinutes: number;
}

/** Built-in roster for Life Lived / any project using this OS. */
export const DEFAULT_ROLE_ROSTER: readonly AgentRoleContract[] = [
  {
    id: "head_manager",
    displayName: "Head Manager / Orchestrator",
    owns: [
      "queue health",
      "prioritisation",
      "routing",
      "dependency ordering",
      "stale recovery",
      "handoffs",
      "escalation",
    ],
    mustNot: ["become product truth", "self-accept implementation", "merge to main"],
    capabilities: ["orchestrate"],
    maxAutonomy: "L3",
    maxRiskWithoutHumanGate: "P1",
    defaultScopeIn: ["docs/agents/"],
    defaultScopeOut: ["main", "src/lib/supply-engine.ts"],
    requiresIndependentReview: false,
    canAcceptOwnWork: false,
    humanGates: ["main_merge", "architecture_invariant_change"],
    evidenceRequired: ["task envelope", "routing decision", "recovery notes"],
    defaultLeaseMinutes: 120,
  },
  {
    id: "product_strategy",
    displayName: "Product & Strategy",
    owns: ["objectives", "acceptance criteria", "roadmap proposals", "opportunity discovery"],
    mustNot: ["convert idea to confirmed requirement without evidence", "second matching engine"],
    capabilities: ["product"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P2",
    defaultScopeIn: ["docs/", "roadmap.md"],
    defaultScopeOut: ["src/lib/supply-engine.ts"],
    requiresIndependentReview: true,
    canAcceptOwnWork: false,
    humanGates: ["regulated_behaviour"],
    evidenceRequired: ["acceptance criteria", "user-value rationale"],
    defaultLeaseMinutes: 180,
  },
  {
    id: "architect",
    displayName: "Architecture",
    owns: ["boundaries", "interfaces", "ADRs", "data models", "integration design"],
    mustNot: ["silently rewrite subsystems", "bypass human architecture gate"],
    capabilities: ["architecture"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P1",
    defaultScopeIn: ["docs/adr/", "docs/agents/", "supabase/migrations/"],
    defaultScopeOut: [],
    requiresIndependentReview: true,
    canAcceptOwnWork: false,
    humanGates: ["architecture_invariant_change", "destructive_migration"],
    evidenceRequired: ["ADR or implementation contract", "risk analysis"],
    defaultLeaseMinutes: 240,
  },
  {
    id: "engineering_frontend",
    displayName: "Engineering — Frontend",
    owns: ["UI implementation within scope", "component tests"],
    mustNot: ["merge to main", "weaken tests", "self-accept"],
    capabilities: ["implementation"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P2",
    defaultScopeIn: ["src/components/", "src/routes/", "src/styles.css"],
    defaultScopeOut: ["supabase/", "main"],
    requiresIndependentReview: true,
    canAcceptOwnWork: false,
    humanGates: ["main_merge"],
    evidenceRequired: ["changed paths", "tests", "handoff"],
    defaultLeaseMinutes: 240,
  },
  {
    id: "engineering_backend",
    displayName: "Engineering — Backend",
    owns: ["server routes", "lib server modules", "API contracts"],
    mustNot: ["merge to main", "expose secrets", "self-accept"],
    capabilities: ["implementation"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P1",
    defaultScopeIn: ["src/lib/", "src/routes/api/"],
    defaultScopeOut: ["main"],
    requiresIndependentReview: true,
    canAcceptOwnWork: false,
    humanGates: ["main_merge", "production_secrets"],
    evidenceRequired: ["changed paths", "tests", "handoff"],
    defaultLeaseMinutes: 240,
  },
  {
    id: "engineering_database",
    displayName: "Engineering — Database",
    owns: ["migrations", "RLS policies", "schema evolution"],
    mustNot: ["destructive migration without human gate", "broaden client privileges"],
    capabilities: ["implementation"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P1",
    defaultScopeIn: ["supabase/migrations/"],
    defaultScopeOut: ["main"],
    requiresIndependentReview: true,
    canAcceptOwnWork: false,
    humanGates: ["destructive_migration", "main_merge"],
    evidenceRequired: ["migration SQL", "rollback notes", "tests or dry-run notes"],
    defaultLeaseMinutes: 180,
  },
  {
    id: "qa_verification",
    displayName: "QA / Independent Verification",
    owns: ["tests", "regression", "acceptance evidence", "adversarial cases"],
    mustNot: ["approve implementer's work as sole authority", "delete tests to go green"],
    capabilities: ["qa", "review"],
    maxAutonomy: "L3",
    maxRiskWithoutHumanGate: "P1",
    defaultScopeIn: [],
    defaultScopeOut: [],
    requiresIndependentReview: false,
    canAcceptOwnWork: false,
    humanGates: [],
    evidenceRequired: ["test results", "findings", "release recommendation"],
    defaultLeaseMinutes: 120,
  },
  {
    id: "security_privacy",
    displayName: "Security / Privacy / Safety",
    owns: ["RLS", "secrets", "threat model", "regulated categories", "access control"],
    mustNot: ["weaken security for green CI", "store secrets in repo"],
    capabilities: ["security_audit", "review"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P0",
    defaultScopeIn: ["supabase/", "src/lib/", "src/routes/api/"],
    defaultScopeOut: [],
    requiresIndependentReview: true,
    canAcceptOwnWork: false,
    humanGates: ["privacy_model_change", "production_secrets", "regulated_behaviour"],
    evidenceRequired: ["findings", "severity", "remediation path"],
    defaultLeaseMinutes: 120,
  },
  {
    id: "research_intelligence",
    displayName: "Research / Intelligence",
    owns: ["market/technical/user research", "evidence collection", "synthesis"],
    mustNot: ["promote UNKNOWN to confirmed", "fabricate sources"],
    capabilities: ["research"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P2",
    defaultScopeIn: ["docs/"],
    defaultScopeOut: ["src/lib/supply-engine.ts"],
    requiresIndependentReview: true,
    canAcceptOwnWork: false,
    humanGates: [],
    evidenceRequired: ["sources", "date", "confidence label", "limitations"],
    defaultLeaseMinutes: 360,
  },
  {
    id: "seo",
    displayName: "SEO",
    owns: ["keyword research", "content briefs", "technical SEO recommendations"],
    mustNot: ["publish without gate", "treat recommendations as confirmed product truth"],
    capabilities: ["seo", "research"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P2",
    defaultScopeIn: ["docs/", "src/routes/"],
    defaultScopeOut: [],
    requiresIndependentReview: true,
    canAcceptOwnWork: false,
    humanGates: ["external_publication"],
    evidenceRequired: ["topic map", "brief", "measurement plan"],
    defaultLeaseMinutes: 240,
  },
  {
    id: "marketing_growth",
    displayName: "Marketing / Growth",
    owns: ["positioning", "campaign concepts", "growth experiments"],
    mustNot: ["paid spend without gate", "external publish without gate"],
    capabilities: ["marketing"],
    maxAutonomy: "L1",
    maxRiskWithoutHumanGate: "P2",
    defaultScopeIn: ["docs/"],
    defaultScopeOut: [],
    requiresIndependentReview: true,
    canAcceptOwnWork: false,
    humanGates: ["external_publication", "paid_spend"],
    evidenceRequired: ["hypothesis", "success metric", "gate checklist"],
    defaultLeaseMinutes: 180,
  },
  {
    id: "design_ux",
    displayName: "Design / UX",
    owns: ["flows", "UI specs", "accessibility", "design-system consistency"],
    mustNot: ["invent privacy policy from UI alone"],
    capabilities: ["design"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P2",
    defaultScopeIn: ["src/components/", "docs/"],
    defaultScopeOut: [],
    requiresIndependentReview: true,
    canAcceptOwnWork: false,
    humanGates: [],
    evidenceRequired: ["flow notes", "a11y considerations", "handoff to implementation"],
    defaultLeaseMinutes: 180,
  },
  {
    id: "documentation_knowledge",
    displayName: "Documentation / Knowledge",
    owns: ["runbooks", "ADRs index", "handoffs", "onboarding"],
    mustNot: ["claim capabilities tests cannot demonstrate"],
    capabilities: ["documentation"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P3",
    defaultScopeIn: ["docs/"],
    defaultScopeOut: [],
    requiresIndependentReview: false,
    canAcceptOwnWork: false,
    humanGates: [],
    evidenceRequired: ["doc paths", "accuracy cross-check"],
    defaultLeaseMinutes: 120,
  },
  {
    id: "devops_release",
    displayName: "DevOps / Release",
    owns: ["CI", "deploy readiness", "rollback evidence", "observability wiring"],
    mustNot: ["production change without human gate"],
    capabilities: ["devops"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P1",
    defaultScopeIn: [".github/", "docs/"],
    defaultScopeOut: [],
    requiresIndependentReview: true,
    canAcceptOwnWork: false,
    humanGates: ["production_deploy", "main_merge"],
    evidenceRequired: ["CI status", "rollback plan"],
    defaultLeaseMinutes: 120,
  },
  {
    id: "analytics_learning",
    displayName: "Analytics / Learning",
    owns: ["measurement plans", "experiment definitions", "post-release learning"],
    mustNot: ["fabricate telemetry"],
    capabilities: ["analytics"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P2",
    defaultScopeIn: ["docs/"],
    defaultScopeOut: [],
    requiresIndependentReview: true,
    canAcceptOwnWork: false,
    humanGates: [],
    evidenceRequired: ["metric definitions", "data source", "confidence"],
    defaultLeaseMinutes: 180,
  },
  {
    id: "agent_factory",
    displayName: "Agent Factory / Meta-agent",
    owns: ["role templates", "new specialist contracts", "permission envelopes"],
    mustNot: ["grant production privileges", "bypass human gates for new roles"],
    capabilities: ["meta_agent", "documentation"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P2",
    defaultScopeIn: ["docs/agents/", "src/lib/agent-"],
    defaultScopeOut: ["main"],
    requiresIndependentReview: true,
    canAcceptOwnWork: false,
    humanGates: ["architecture_invariant_change"],
    evidenceRequired: ["role contract", "tests", "routing registration"],
    defaultLeaseMinutes: 180,
  },
] as const;

export function getRoleById(id: SpecialistRoleId): AgentRoleContract | undefined {
  return DEFAULT_ROLE_ROSTER.find((r) => r.id === id);
}

export function rolesWithCapability(cap: RoleCapability): AgentRoleContract[] {
  return DEFAULT_ROLE_ROSTER.filter((r) => r.capabilities.includes(cap));
}
