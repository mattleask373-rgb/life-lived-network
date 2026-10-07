/**
 * Provider-neutral execution abstraction.
 * Providers are interchangeable capabilities, not architectural dependencies.
 *
 * See docs/agents/ORCHESTRATION.md — provider routing is policy-driven.
 * execute() adapters remain DISABLED until human activation.
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

const CAPABILITY_BY_LANE: Record<AgentTaskEnvelope["lane"], ProviderCapability | null> = {
  PRODUCT: "research",
  ARCHITECTURE: "review",
  IMPLEMENTATION: "implementation",
  QA: "qa",
  SECURITY: "security_audit",
  REVIEW: "review",
  ORCHESTRATOR: null,
};

const AUTONOMY_RANK: Record<AutonomyLevel, number> = {
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
};

const RISK_RANK: Record<RiskLevel, number> = {
  P3: 0,
  P2: 1,
  P1: 2,
  P0: 3,
};

export function isEligibleProvider(
  provider: ProviderDescriptor,
  task: Pick<AgentTaskEnvelope, "autonomy" | "risk" | "lane">,
  policy: ProviderSelectionPolicy,
): { eligible: boolean; reason: string } {
  if (policy.excludeProviders.includes(provider.id)) {
    return { eligible: false, reason: `provider ${provider.id} excluded by policy` };
  }

  const requiredCapability = CAPABILITY_BY_LANE[task.lane];
  if (requiredCapability && !provider.capabilities.includes(requiredCapability)) {
    return {
      eligible: false,
      reason: `provider ${provider.id} lacks required capability ${requiredCapability} for lane ${task.lane}`,
    };
  }

  if (policy.requireHumanFor.includes(task.risk) && provider.id !== "human") {
    return {
      eligible: false,
      reason: `risk ${task.risk} requires human gate; provider ${provider.id} is not the human provider`,
    };
  }
  if (AUTONOMY_RANK[task.autonomy] > AUTONOMY_RANK[provider.maxAutonomy]) {
    return {
      eligible: false,
      reason: `task autonomy ${task.autonomy} exceeds provider max ${provider.maxAutonomy}`,
    };
  }
  return { eligible: true, reason: "eligible under policy" };
}

/**
 * Select the least constrained eligible provider.
 * Preference order: automated over human, then preferred reliability → standard →
 * experimental; then lower costClass. Does not invoke health() (caller may pre-filter).
 */
export function selectProvider(
  candidates: ProviderDescriptor[],
  task: Pick<AgentTaskEnvelope, "autonomy" | "risk" | "lane">,
  policy: ProviderSelectionPolicy,
): ProviderDescriptor | null {
  const eligible = candidates.filter((p) => isEligibleProvider(p, task, policy).eligible);
  if (eligible.length === 0) {
    return null;
  }

  const reliabilityOrder = { preferred: 0, standard: 1, experimental: 2 } as const;
  const costOrder = { free: 0, low: 1, medium: 2, high: 3, human: 4 } as const;

  const sorted = [...eligible].sort((a, b) => {
    // Prefer automated providers; human is last-resort unless exclusively eligible.
    const aHuman = a.costClass === "human" ? 1 : 0;
    const bHuman = b.costClass === "human" ? 1 : 0;
    if (aHuman !== bHuman) {
      return aHuman - bHuman;
    }
    const r = reliabilityOrder[a.reliabilityClass] - reliabilityOrder[b.reliabilityClass];
    if (r !== 0) {
      return r;
    }
    return costOrder[a.costClass] - costOrder[b.costClass];
  });

  return sorted[0] ?? null;
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
