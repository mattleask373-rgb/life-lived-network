import { describe, expect, it } from "vitest";

import {
  assertPermission,
  buildSpecialistSpec,
  resolvePermissions,
} from "./agent-capability-registry";
import { emptyCounters, successRate } from "./agent-evaluation-schema";
import { buildAttentionItem, isOfflineSafe, mustQueueForHuman } from "./agent-human-attention";
import { canTransitionLifecycle, evaluateHealth, shouldSuspendRouting } from "./agent-lifecycle";
import { createMemoryRecord, isAuthoritativeMemory } from "./agent-org-memory";
import {
  canAdvanceOpportunity,
  canSpawnTaskFromOpportunity,
  type OpportunityRecord,
} from "./agent-opportunity";
import { nextDegradationAction } from "./agent-provider-degradation";
import { priorityWaivesSafetyGates, scorePriority } from "./agent-priority";
import { bootstrapProject, LIFE_LIVED_BOOTSTRAP_EXAMPLE } from "./agent-project-bootstrap";
import { generateCandidateWork, promoteCandidateToRequirement } from "./agent-work-generator";

describe("capability registry", () => {
  it("never allows merge_main via capability resolution", () => {
    const env = resolvePermissions(["adversarial_qa", "threat_modelling"]);
    expect(assertPermission(env, "merge_main").ok).toBe(false);
    expect(env.allow.includes("merge_main")).toBe(false);
  });

  it("builds specialist spec with independent review required", () => {
    const spec = buildSpecialistSpec({
      identity: "seo-research-1",
      roleId: "seo",
      mission: "Map search intent",
      capabilities: ["search_intent_analysis", "evidence_synthesis"],
    });
    expect(spec.requiresIndependentReview).toBe(true);
    expect(assertPermission(spec.permissions, "publish_external").ok).toBe(false);
  });
});

describe("agent lifecycle and health", () => {
  it("allows PROPOSED → SPECIFIED → EVALUATING → ACTIVE", () => {
    expect(canTransitionLifecycle("PROPOSED", "SPECIFIED")).toBe(true);
    expect(canTransitionLifecycle("SPECIFIED", "EVALUATING")).toBe(true);
    expect(canTransitionLifecycle("EVALUATING", "ACTIVE")).toBe(true);
  });

  it("cannot resurrect RETIRED", () => {
    expect(canTransitionLifecycle("RETIRED", "ACTIVE")).toBe(false);
  });

  it("FAILING health suspends routing preference", () => {
    const health = evaluateHealth({
      recentFailures: 5,
      recentReviewRejections: 0,
      malformedHandoffs: 0,
      scopeViolations: 0,
      evidenceViolations: 0,
    });
    expect(health).toBe("FAILING");
    expect(shouldSuspendRouting(health)).toBe(true);
  });
});

describe("opportunity pipeline", () => {
  it("advances stage by stage only", () => {
    expect(canAdvanceOpportunity("SIGNAL", "HYPOTHESIS")).toBe(true);
    expect(canAdvanceOpportunity("SIGNAL", "OPPORTUNITY")).toBe(false);
  });

  it("refuses task spawn from PROPOSED confidence", () => {
    const opp: OpportunityRecord = {
      id: "o1",
      projectId: "life-lived-network",
      domain: "product",
      stage: "DECISION",
      statement: "Maybe offline mode",
      confidence: "PROPOSED",
      evidenceRefs: [],
      productDecision: "accepted",
      createdByRole: "research_intelligence",
    };
    expect(canSpawnTaskFromOpportunity(opp).ok).toBe(false);
  });
});

describe("work generator", () => {
  it("candidates are never confirmed requirements", () => {
    const cw = generateCandidateWork({
      projectId: "life-lived-network",
      source: "research_finding",
      title: "Users might want X",
      rationale: "Weak signal",
      confidence: "PROPOSED",
    });
    expect(cw.isConfirmedRequirement).toBe(false);
    expect(cw.requiresHumanDecision).toBe(true);
  });

  it("UNKNOWN cannot be promoted to requirement", () => {
    const cw = generateCandidateWork({
      projectId: "p",
      source: "user_feedback",
      title: "Unclear",
      rationale: "n=1",
      confidence: "UNKNOWN",
    });
    expect(promoteCandidateToRequirement(cw, "human").ok).toBe(false);
  });
});

describe("provider degradation", () => {
  it("does not retry forever", () => {
    expect(
      nextDegradationAction({
        kind: "timeout",
        consecutiveFailures: 3,
        alternateAvailable: false,
        humanAvailable: false,
        isDeterministicFailure: false,
      }),
    ).toBe("blocked");
  });

  it("prefers alternate provider after repeated failure", () => {
    expect(
      nextDegradationAction({
        kind: "invalid_result",
        consecutiveFailures: 3,
        alternateAvailable: true,
        humanAvailable: true,
        isDeterministicFailure: false,
      }),
    ).toBe("alternate_provider");
  });
});

describe("priority", () => {
  it("never waives safety gates", () => {
    const score = scorePriority({
      risk: "P0",
      urgency: 3,
      customerImpact: 3,
      blockingOthers: true,
      ageHours: 48,
      securitySeverity: 3,
      humanDeadlineHours: 1,
    });
    expect(score).toBeGreaterThan(50);
    expect(priorityWaivesSafetyGates(score)).toBe(false);
  });
});

describe("org memory", () => {
  it("rejects UNKNOWN verified_fact", () => {
    expect(() =>
      createMemoryRecord({
        id: "m1",
        projectId: "p",
        kind: "verified_fact",
        statement: "maybe",
        confidence: "UNKNOWN",
        evidenceRefs: [],
        tags: [],
      }),
    ).toThrow(/UNKNOWN/);
  });

  it("KNOWN product decisions are authoritative memory", () => {
    const rec = createMemoryRecord({
      id: "m2",
      projectId: "p",
      kind: "product_decision",
      statement: "Ship X",
      confidence: "KNOWN",
      evidenceRefs: ["ADR-1"],
      tags: ["product"],
    });
    expect(isAuthoritativeMemory(rec)).toBe(true);
  });
});

describe("human offline mode", () => {
  it("classifies offline-safe vs human-queued work", () => {
    expect(isOfflineSafe("research")).toBe(true);
    expect(mustQueueForHuman("production_deployment")).toBe(true);
    expect(mustQueueForHuman("final_integration_to_main")).toBe(true);
  });

  it("builds attention items with decision options", () => {
    const item = buildAttentionItem({
      projectId: "life-lived-network",
      kind: "APPROVAL_REQUIRED",
      summary: "Merge PR after review",
      whyItMatters: "Integration blocked",
      evidenceRefs: ["PR#61"],
      decisionNeeded: "Approve or request changes",
      ifWaitConsequence: "Queue grows; no prod impact",
      safeOptions: ["approve", "request_changes", "defer"],
      blocking: true,
    });
    expect(item.safeOptions.length).toBeGreaterThan(0);
  });
});

describe("evaluation schema", () => {
  it("returns null success rate without data (no fabrication)", () => {
    expect(successRate(emptyCounters())).toBeNull();
  });
});

describe("project isolation + golden path", () => {
  it("bootstraps Project B isolated from Life Lived", () => {
    const projectB = bootstrapProject({
      projectId: "project-b-demo",
      displayName: "Project B",
      objective: "Prove copy-configure-run",
      repositories: ["example/project-b"],
      domain: "demo",
      techStack: ["TypeScript"],
      environments: ["local", "staging"],
      riskProfile: "P2",
      allowedProviders: ["human", "grok"],
      sourceOfTruthOrder: ["repository", "tests", "docs"],
    });
    const life = bootstrapProject(LIFE_LIVED_BOOTSTRAP_EXAMPLE);
    expect(projectB.config.projectId).not.toBe(life.config.projectId);
    expect(projectB.config.repositories[0]).not.toBe(life.config.repositories[0]);
    expect(projectB.reviewPolicy.implementerCannotAccept).toBe(true);
    expect(projectB.reviewPolicy.humanRequiredForIntegration).toBe(true);
  });

  it("golden path: config → team → candidate work stays unconfirmed", () => {
    const boot = bootstrapProject(LIFE_LIVED_BOOTSTRAP_EXAMPLE);
    expect(boot.roster.length).toBeGreaterThan(0);
    const candidate = generateCandidateWork({
      projectId: boot.config.projectId,
      source: "seo_opportunity",
      title: "Local landing page opportunity",
      rationale: "Search volume signal",
      confidence: "INFERRED",
      suggestedRoleCapabilities: ["seo"],
    });
    expect(candidate.projectId).toBe(boot.config.projectId);
    expect(candidate.isConfirmedRequirement).toBe(false);
  });
});
