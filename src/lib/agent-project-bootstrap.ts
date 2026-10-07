/**
 * Project bootstrap — configure a project, derive the team OS instance.
 * Pattern: Project A/B/C → same operating system, different config.
 */

import {
  DEFAULT_ROLE_ROSTER,
  type AgentRoleContract,
  type SpecialistRoleId,
} from "./agent-role-contract";
import type { RiskLevel } from "./agent-orchestration";

export interface ProjectBootstrapConfig {
  projectId: string;
  displayName: string;
  objective: string;
  repositories: string[];
  domain: string;
  techStack: string[];
  environments: Array<"local" | "staging" | "production">;
  riskProfile: RiskLevel;
  allowedProviders: string[];
  enabledRoles?: SpecialistRoleId[];
  /** Extra human gates beyond role defaults. */
  additionalHumanGates?: string[];
  monthlyBudgetHint?: string;
  sourceOfTruthOrder: string[];
}

export interface BootstrappedProject {
  config: ProjectBootstrapConfig;
  roster: AgentRoleContract[];
  routingPolicy: {
    requireHumanFor: RiskLevel[];
    excludeProviders: string[];
    preferIndependentReviewer: boolean;
  };
  reviewPolicy: {
    implementerCannotAccept: true;
    independentReviewRequiredForImplementation: true;
    humanRequiredForIntegration: true;
  };
  ciExpectations: string[];
  onboardingChecklist: string[];
  continuousLoops: string[];
}

export function bootstrapProject(config: ProjectBootstrapConfig): BootstrappedProject {
  if (!config.projectId?.trim()) {
    throw new Error("projectId is required");
  }
  if (!config.objective?.trim()) {
    throw new Error("objective is required");
  }
  if (!config.repositories?.length) {
    throw new Error("at least one repository is required");
  }
  if (!config.sourceOfTruthOrder?.length) {
    throw new Error("sourceOfTruthOrder is required");
  }

  const enabled = new Set(config.enabledRoles ?? DEFAULT_ROLE_ROSTER.map((r) => r.id));
  const roster = DEFAULT_ROLE_ROSTER.filter((r) => enabled.has(r.id));

  const requireHumanFor: RiskLevel[] =
    config.riskProfile === "P0"
      ? ["P0", "P1"]
      : config.riskProfile === "P1"
        ? ["P0", "P1"]
        : ["P0"];

  return {
    config,
    roster,
    routingPolicy: {
      requireHumanFor,
      excludeProviders: [],
      preferIndependentReviewer: true,
    },
    reviewPolicy: {
      implementerCannotAccept: true,
      independentReviewRequiredForImplementation: true,
      humanRequiredForIntegration: true,
    },
    ciExpectations: [
      "lint",
      "unit tests",
      "build",
      "no secrets in diff",
      "no autonomous merge to main",
    ],
    onboardingChecklist: [
      "Confirm source-of-truth hierarchy",
      "Register repositories and default scopes",
      "Enable role roster",
      "Set risk profile and human gates",
      "Connect observability destinations (optional)",
      "Keep provider execute disabled until staging smoke",
      "Keep production webhooks disabled until verified",
      "Run claim → review → human integrate smoke on staging",
    ],
    continuousLoops: [
      "engineering: bug/feature → claim → implement → verify → review → integrate",
      "research: question → evidence → synthesis → product opportunity",
      "seo: topic → brief → implement → measure",
      "marketing: hypothesis → asset → human gate → experiment → learn",
      "reliability: signal → investigate → remediate → verify",
    ],
  };
}

/** Example bootstrap for this repository (documentation / tests only). */
export const LIFE_LIVED_BOOTSTRAP_EXAMPLE: ProjectBootstrapConfig = {
  projectId: "life-lived-network",
  displayName: "Life Lived Network / Living World",
  objective: "Provider-neutral multi-agent development OS proving ground",
  repositories: ["mattleask373-rgb/life-lived-network"],
  domain: "local discovery / capability supply",
  techStack: ["TypeScript", "TanStack Start", "Supabase", "Vitest"],
  environments: ["local", "staging", "production"],
  riskProfile: "P1",
  allowedProviders: ["grok", "openai", "plane_ai", "human"],
  sourceOfTruthOrder: [
    "repository implementation",
    "tests / CI",
    "database schema / migrations",
    "docs/agents control-plane artifacts",
    "Plane task state",
    "agent conversation (never authoritative alone)",
  ],
};
