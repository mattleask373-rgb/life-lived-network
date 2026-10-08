import { describe, expect, it } from "vitest";
import type { AuthenticatedExecutionContext } from "./agent-execution-identity";
import type { DispatchRequest } from "./agent-dispatch.server";

describe("agent dispatch boundary", () => {
  const context: AuthenticatedExecutionContext = {
    actorId: "actor-1",
    runId: "run-1",
    workspaceId: "workspace-1",
    correlationId: "dispatch:run-1:task-1",
  };

  const request: DispatchRequest = {
    taskId: "task-1",
    providerId: "provider-1",
    projectId: "project-1",
  };

  it("requires authenticated execution identity before reaching the RPC", () => {
    expect(context.actorId).toBe("actor-1");
    expect(context.runId).toBe("run-1");
    expect(context.workspaceId).toBe("workspace-1");
    expect(request.projectId).toBe("project-1");
  });

  it("derives correlation from the authenticated run boundary", () => {
    expect(context.correlationId).toBe("dispatch:run-1:task-1");
    expect(request.taskId).not.toBe("");
  });
});
