import { describe, expect, it } from "vitest";

import { createRoleFromTemplate, registerRole, validateRoleTemplate } from "./agent-factory";
import {
  bootstrapProject,
  LIFE_LIVED_BOOTSTRAP_EXAMPLE,
} from "./agent-project-bootstrap";
import {
  isSafeResearchFinding,
  nextSafeStepFromFinding,
  validateResearchFinding,
  type ResearchFinding,
} from "./agent-research-contract";
import { DEFAULT_ROLE_ROSTER } from "./agent-role-contract";
import { routeTask } from "./agent-work-routing";

describe("agent factory", () => {
  it("rejects empty templates", () => {
    const issues = validateRoleTemplate({
      id: "",
      displayName: "",
      owns: [],
      capabilities: [],
    });
    expect(issues.map((i) => i.code)).toEqual(
      expect.arrayContaining(["MISSING_ID", "MISSING_NAME", "NO_CAPABILITIES", "NO_OWNS"]),
    );
  });

  it("creates role with canAcceptOwnWork always false", () => {
    const role = createRoleFromTemplate({
      id: "seo",
      displayName: "SEO Specialist",
      owns: ["keyword research"],
      capabilities: ["seo", "research"],
    });
    expect(role.canAcceptOwnWork).toBe(false);
    expect(role.mustNot.some((m) => m.includes("self-accept"))).toBe(true);
  });

  it("refuses duplicate registration", () => {
    const role = createRoleFromTemplate({
      id: "agent_factory",
      displayName: "Factory",
      owns: ["templates"],
      capabilities: ["meta_agent"],
    });
    expect(() => registerRole(DEFAULT_ROLE_ROSTER, role)).toThrow(/already registered/);
  });
});

describe("research boundary", () => {
  it("KNOWN requires sources", () => {
    const finding: ResearchFinding = {
      id: "r1",
      statement: "Users may want offline mode",
      confidence: "KNOWN",
      sources: [],
      limitations: [],
      isProductRequirement: false,
    };
    expect(validateResearchFinding(finding).some((i) => i.code === "KNOWN_WITHOUT_SOURCE")).toBe(
      true,
    );
  });

  it("UNKNOWN cannot become product requirement", () => {
    const finding: ResearchFinding = {
      id: "r2",
      statement: "Unclear demand",
      confidence: "UNKNOWN",
      sources: [],
      limitations: ["no data"],
      isProductRequirement: true,
    };
    expect(isSafeResearchFinding(finding)).toBe(false);
  });

  it("PROPOSED stays out of implementation", () => {
    const finding: ResearchFinding = {
      id: "r3",
      statement: "Hypothesis: local SEO pages convert",
      confidence: "PROPOSED",
      sources: [{ title: "internal note", retrievedAt: "2026-10-07" }],
      limitations: ["anecdotal"],
      isProductRequirement: false,
    };
    expect(isSafeResearchFinding(finding)).toBe(true);
    expect(nextSafeStepFromFinding(finding)).toMatch(/product opportunity/);
  });
});

describe("project bootstrap", () => {
  it("derives roster and immutable review policy", () => {
    const boot = bootstrapProject(LIFE_LIVED_BOOTSTRAP_EXAMPLE);
    expect(boot.roster.length).toBeGreaterThan(5);
    expect(boot.reviewPolicy.implementerCannotAccept).toBe(true);
    expect(boot.reviewPolicy.humanRequiredForIntegration).toBe(true);
    expect(boot.ciExpectations).toContain("lint");
    expect(boot.continuousLoops.some((l) => l.startsWith("research:"))).toBe(true);
  });

  it("requires projectId objective repos sourceOfTruth", () => {
    expect(() =>
      bootstrapProject({
        ...LIFE_LIVED_BOOTSTRAP_EXAMPLE,
        projectId: "",
      }),
    ).toThrow(/projectId/);
  });
});

describe("work routing", () => {
  it("routes implementation to engineering role", () => {
    const decision = routeTask(
      {
        taskId: "LW-1",
        objective: "Add API route",
        requiredCapabilities: ["implementation"],
        risk: "P2",
        scopeIn: ["src/routes/api/"],
      },
      DEFAULT_ROLE_ROSTER,
    );
    expect(decision.recommended).not.toBeNull();
    expect(decision.recommended?.capabilities).toContain("implementation");
  });

  it("rejects roles on path conflict", () => {
    const decision = routeTask(
      {
        taskId: "LW-2",
        objective: "Touch migrations",
        requiredCapabilities: ["implementation"],
        risk: "P1",
        scopeIn: ["supabase/migrations/"],
        blockedPaths: ["supabase/migrations/"],
      },
      DEFAULT_ROLE_ROSTER,
    );
    expect(
      decision.rejected.some(
        (r) => r.roleId === "engineering_database" && r.reason.includes("path conflict"),
      ),
    ).toBe(true);
  });

  it("routes research capability to research role", () => {
    const decision = routeTask(
      {
        taskId: "LW-3",
        objective: "Competitor scan",
        requiredCapabilities: ["research"],
        risk: "P3",
        scopeIn: ["docs/"],
      },
      DEFAULT_ROLE_ROSTER,
    );
    expect(decision.eligible.some((r) => r.id === "research_intelligence")).toBe(true);
  });
});
