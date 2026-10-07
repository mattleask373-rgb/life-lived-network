import { describe, expect, test } from "vitest";
import {
  requiresHumanApproval,
  validateAgentActionRequest,
  validateHumanApproval,
  type AgentActionRequest,
} from "./agent-identity-contract";

const identity = {
  actorId: "agent:builder-1",
  agentId: "builder-1",
  runId: "run-1",
  workspaceId: "workspace-1",
  projectId: "project-1",
};

const baseRequest: AgentActionRequest = {
  identity,
  taskId: "task-1",
  action: "execute",
  risk: "P3",
  reversible: true,
  requiresHumanGate: false,
};

const approval = {
  approvalId: "approval-1",
  approverId: "human:1",
  workspaceId: "workspace-1",
  projectId: "project-1",
  taskId: "task-1",
  action: "execute" as const,
  issuedAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2027-01-01T00:00:00.000Z",
};

describe("agent-identity-contract", () => {
  const now = new Date("2026-10-08T00:00:00.000Z");

  test("accepts a scoped provider-neutral identity", () => {
    expect(validateAgentActionRequest(baseRequest, now).valid).toBe(true);
  });

  test("requires approval for irreversible or high-risk actions", () => {
    expect(
      requiresHumanApproval({
        risk: "P3",
        reversible: false,
        requiresHumanGate: false,
        action: "execute",
      }),
    ).toBe(true);
    expect(
      validateAgentActionRequest(
        { ...baseRequest, risk: "P1" },
        now,
      ).valid,
    ).toBe(false);
  });

  test("rejects an approval from the wrong scope", () => {
    const result = validateHumanApproval(
      { ...approval, projectId: "other-project" },
      baseRequest,
      now,
    );
    expect(result.valid).toBe(false);
  });

  test("rejects expired approval", () => {
    const result = validateHumanApproval(
      { ...approval, expiresAt: "2026-10-07T23:59:00.000Z" },
      { ...baseRequest, requiresHumanGate: true },
      now,
    );
    expect(result.valid).toBe(false);
  });

  test("rejects agent self-approval", () => {
    const result = validateHumanApproval(
      { ...approval, approverId: identity.actorId },
      { ...baseRequest, requiresHumanGate: true },
      now,
    );
    expect(result.valid).toBe(false);
  });

  test("rejects an approval for another action", () => {
    const result = validateHumanApproval(
      { ...approval, action: "deploy" },
      { ...baseRequest, requiresHumanGate: true },
      now,
    );
    expect(result.valid).toBe(false);
  });

  test("requires approval for merge/deploy regardless of caller claim", () => {
    expect(
      validateAgentActionRequest(
        { ...baseRequest, action: "merge" },
        now,
      ).valid,
    ).toBe(false);
    expect(
      validateAgentActionRequest(
        { ...baseRequest, action: "deploy" },
        now,
      ).valid,
    ).toBe(false);
  });

  test("valid high-risk request can proceed only with matching human approval", () => {
    const result = validateAgentActionRequest(
      {
        ...baseRequest,
        risk: "P1",
        requiresHumanGate: true,
        approval,
      },
      now,
    );
    expect(result.valid).toBe(true);
  });
});
