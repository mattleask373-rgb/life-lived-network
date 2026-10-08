import { describe, expect, it } from "vitest";
import { canConsumeHumanApproval, validateHumanApproval, type HumanApproval } from "./human-approval-contract";

const base: HumanApproval = { approvalId: "approval-1", taskId: "task-1", actorId: "actor-1", workspaceId: "workspace-1", projectId: "project-1", issuedByHumanId: "human-1", status: "PENDING", issuedAt: "2026-10-08T17:00:00Z", expiresAt: "2026-10-08T18:00:00Z", consumedAt: null };

describe("human approval contract", () => {
  it("accepts an unexpired pending scoped approval", () => expect(validateHumanApproval(base, new Date("2026-10-08T17:30:00Z"))).toBe(true));
  it("rejects consumed approvals", () => expect(validateHumanApproval({ ...base, status: "CONSUMED", consumedAt: "2026-10-08T17:20:00Z" }, new Date("2026-10-08T17:30:00Z"))).toBe(false));
  it("rejects expired approvals", () => expect(validateHumanApproval(base, new Date("2026-10-08T18:00:01Z"))).toBe(false));
  it("rejects cross-task reuse", () => expect(canConsumeHumanApproval(base, { taskId: "task-2", actorId: "actor-1", workspaceId: "workspace-1", projectId: "project-1" }, new Date("2026-10-08T17:30:00Z"))).toBe(false));
  it("rejects cross-scope reuse", () => expect(canConsumeHumanApproval(base, { taskId: "task-1", actorId: "actor-1", workspaceId: "workspace-2", projectId: "project-1" }, new Date("2026-10-08T17:30:00Z"))).toBe(false));
});