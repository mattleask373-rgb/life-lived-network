/**
 * Provider-neutral execution abstraction.
 * Providers are interchangeable capabilities, not architectural dependencies.
 *
 * See docs/agents/ORCHESTRATION.md — provider routing is policy-driven.
 */

import type { AgentTaskEnvelope, AutonomyLevel, RiskLevel } from "./agent-orchestration";
import type { AgentExecutionResult } from "./agent-execution-contract";

export type ProviderCapability =
  "implementation" | "review" | "research" | "security_audit" | "qa" | "human_judgment";

export type ProviderHealthStatus = "available" | "degraded" | "unavailable" | "unknown";

export interface ProviderHealth {
  status: ProviderHealthStatus;
  checkedAt: string;
  detail?: string;
  latencyMs?: number;
}

export interface ProviderDescriptor {
  id: string;
  displayName: string;
  capabilities: ProviderCapability[];
  /** Autonomy levels this provider is allowed to execute under policy. */
  maxAutonomy: AutonomyLevel;
  /** Highest risk this provider may touch without human gate. */
  maxRiskWithoutHumanGate: RiskLevel;
  costClass: "free" | "low" | "medium" | "high" | "human";
  reliabilityClass: "experimental" | "standard" | "preferred";
}

/**
 * Runtime provider. Implementations must not treat model output as product truth.
 * execute() must return structured evidence (AgentExecutionResult).
 */
export interface AgentProvider extends ProviderDescriptor {
  health(): Promise<ProviderHealth>;
  execute(task: AgentTaskEnvelope, signal?: AbortSignal): Promise<AgentExecutionResult>;
  cancel?(taskId: string): Promise<void>;
}

export type ProviderSelectionPolicy = {
  preferIndependentReviewer: boolean;
  requireHumanFor: RiskLevel[];
  excludeProviders: string[];
};

const AUTONOMY_RANK: Record<AutonomyLevel, number> = {
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
};

export function isEligibleProvider(
  provider: ProviderDescriptor,
  task: Pick<AgentTaskEnvelope, "autonomy" | "risk" | "lane">,
  policy: ProviderSelectionPolicy,
): { eligible: boolean; reason: string } {
  if (policy.excludeProviders.includes(provider.id)) {
    return { eligible: false, reason: `provider ${provider.id} excluded by policy` };
  }
  if (AUTONOMY_RANK[task.autonomy] > AUTONOMY_RANK[provider.maxAutonomy]) {
    return {
      eligible: false,
      reason: `task autonomy ${task.autonomy} exceeds provider max ${provider.maxAutonomy}`,
    };
  }
  if (policy.requireHumanFor.includes(task.risk) && provider.id !== "human") {
    return {
      eligible: false,
      reason: `risk ${task.risk} requires human gate; provider ${provider.id} not human`,
    };
  }
  return { eligible: true, reason: "eligible under policy" };
}

/**
 * Select the least constrained eligible provider.
 * Preference order: preferred reliability → standard → experimental;
 * then lower costClass. Does not invoke health() (caller may pre-filter).
 */
export function selectProvider(
  candidates: ProviderDescriptor[],
  task: Pick<AgentTaskEnvelope, "autonomy" | "risk" | "lane">,
  policy: ProviderSelectionPolicy,
): ProviderDescriptor | null {
  const eligible = candidates.filter((p) => isEligibleProvider(p, task, policy).eligible);
  if (eligible.length === 0) return null;

  // Human is the explicit gate/fallback, not the default automated runner.
  // If a non-human provider is eligible, prefer it unless policy requires human.
  const humanRequired = policy.requireHumanFor.includes(task.risk);
  const nonHumanEligible = eligible.filter((p) => p.id !== "human");
  const routingPool = !humanRequired && nonHumanEligible.length > 0 ? nonHumanEligible : eligible;

  const reliabilityOrder = { preferred: 0, standard: 1, experimental: 2 } as const;
  const costOrder = { free: 0, low: 1, medium: 2, high: 3, human: 4 } as const;

  return [...routingPool].sort((a, b) => {
    const r = reliabilityOrder[a.reliabilityClass] - reliabilityOrder[b.reliabilityClass];
    if (r !== 0) return r;
    return costOrder[a.costClass] - costOrder[b.costClass];
  })[0]!;
}

/** Built-in descriptors for documentation and tests — not auto-registered. */
export const EXAMPLE_PROVIDER_DESCRIPTORS: ProviderDescriptor[] = [
  {
    id: "grok",
    displayName: "Grok",
    capabilities: ["implementation", "review", "research", "security_audit", "qa"],
    maxAutonomy: "L3",
    maxRiskWithoutHumanGate: "P1",
    costClass: "medium",
    reliabilityClass: "standard",
  },
  {
    id: "openai",
    displayName: "OpenAI / ChatGPT",
    capabilities: ["implementation", "review", "research", "qa"],
    maxAutonomy: "L3",
    maxRiskWithoutHumanGate: "P1",
    costClass: "medium",
    reliabilityClass: "standard",
  },
  {
    id: "plane_ai",
    displayName: "Plane AI",
    capabilities: ["implementation", "research"],
    maxAutonomy: "L2",
    maxRiskWithoutHumanGate: "P2",
    costClass: "low",
    reliabilityClass: "experimental",
  },
  {
    id: "human",
    displayName: "Human",
    capabilities: [
      "implementation",
      "review",
      "research",
      "security_audit",
      "qa",
      "human_judgment",
    ],
    maxAutonomy: "L4",
    maxRiskWithoutHumanGate: "P0",
    costClass: "human",
    reliabilityClass: "preferred",
  },
];
