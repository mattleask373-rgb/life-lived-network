import { describe, expect, it } from "vitest";

import {
  requiresHumanApproval,
  validateAgentActionRequest,
  validateAgentIdentity,
  type AgentActionRequest,
} from "./agent-identity-contract";

const now = new Date("2026-10-07T12:00:00.000Z");

const baseIdentity = {
  actorId: "actor-1",
  agentId: "agent-1",
  runId: "run-1",
  workspaceId: "ws-1",
  projectId: "proj-1",
};

const baseApproval = {
  approvalId: "appr-1",
  approverId: "human-1",
  workspaceId: "ws-1",
  projectId: "proj-1",
  taskId: "task-1",
  action: "execute" as const,
  issuedAt: "2026-10-07T11:00:00.000Z",
  expiresAt: "2026-10-07T13:00:00.000Z",
};

const baseRequest: AgentActionRequest = {
  identity: baseIdentity,
  taskId: "task-1",
  action: "execute",
  risk: "P3",
  reversible: true,
  requiresHumanGate: false,
};

describe("agent-identity-contract", () => {
  it("validates a complete identity", () => {
    expect(validateAgentIdentity(baseIdentity).valid).toBe(true);
  });

  it("rejects incomplete identity", () => {
    expect(validateAgentIdentity({ ...baseIdentity, actorId: "" }).valid).toBe(false);
  });

  it("allows low-risk reversible execute without approval", () => {
    expect(validateAgentActionRequest(baseRequest, now).valid).toBe(true);
  });

  it("requires approval for P1 risk", () => {
    expect(validateAgentActionRequest({ ...baseRequest, risk: "P1" }, now).valid).toBe(false);
    expect(
      validateAgentActionRequest(
        { ...baseRequest, risk: "P1", approval: { ...baseApproval, action: "execute" } },
        now,
      ).valid,
    ).toBe(true);
  });

  it("rejects expired approval", () => {
    expect(
      validateAgentActionRequest(
        {
          ...baseRequest,
          risk: "P1",
          approval: {
            ...baseApproval,
            issuedAt: "2026-10-07T09:00:00.000Z",
            expiresAt: "2026-10-07T10:00:00.000Z",
          },
        },
        now,
      ).valid,
    ).toBe(false);
  });

  it("rejects self-approval", () => {
    expect(
      validateAgentActionRequest(
        {
          ...baseRequest,
          risk: "P1",
          approval: { ...baseApproval, approverId: "actor-1" },
        },
        now,
      ).valid,
    ).toBe(false);
  });

  it("never treats merge or deploy as ungated", () => {
    expect(requiresHumanApproval({ ...baseRequest, action: "merge" })).toBe(true);
    expect(validateAgentActionRequest({ ...baseRequest, action: "merge" }, now).valid).toBe(false);
    expect(validateAgentActionRequest({ ...baseRequest, action: "deploy" }, now).valid).toBe(false);
  });

  it("rejects approval scope mismatches", () => {
    expect(
      validateAgentActionRequest(
        {
          ...baseRequest,
          risk: "P1",
          approval: { ...baseApproval, workspaceId: "other-ws" },
        },
        now,
      ).valid,
    ).toBe(false);
  });
});
