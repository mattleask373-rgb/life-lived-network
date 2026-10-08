import { describe, expect, it, vi } from "vitest";
import { runBoundedSupervisorCycle } from "./agent-supervisor-cycle";
import { EXAMPLE_PROVIDER_DESCRIPTORS } from "./agent-provider";

const task = { task_id: "task-1", objective: "bounded work", lane: "IMPLEMENTATION" as const, autonomy: "L2" as const, risk: "P3" as const, scope_in: [], scope_out: ["main"], dependencies: [], acceptance_criteria: ["tests"], invariants: ["no merge"], provider: "auto" as const, source: { system: "plane" as const, workspace_id: "workspace-1", work_item_id: "work-1", event_id: "event-1" } };

describe("bounded supervisor cycle", () => {
  it("stops before dispatch when scope authority is missing", async () => {
    const dispatch = vi.fn();
    const result = await runBoundedSupervisorCycle({
      actorId: "actor-1", task, provider: EXAMPLE_PROVIDER_DESCRIPTORS[0],
      providerPolicy: { preferIndependentReviewer: true, requireHumanFor: ["P0","P1"], excludeProviders: [] },
      durableControlPlaneProven: true, hostedSecurityProof: true,
      adapters: {
        lookupScope: async () => null, checkDurableControlPlane: async () => true, checkHostedSecurity: async () => true,
        readProviderHealth: async () => ({ status: "available", checkedAt: new Date().toISOString() }), hasActiveAttempt: async () => null, requestDispatch: dispatch,
      },
    }).catch((error: unknown) => error);
    expect(dispatch).not.toHaveBeenCalled();
    expect(String(result)).toContain("no authoritative workspace/project scope");
  });

  it("dispatches only after all injected proof gates pass", async () => {
    const dispatch = vi.fn();
    const result = await runBoundedSupervisorCycle({
      actorId: "actor-1", task, provider: EXAMPLE_PROVIDER_DESCRIPTORS[0],
      providerPolicy: { preferIndependentReviewer: true, requireHumanFor: ["P0","P1"], excludeProviders: [] },
      durableControlPlaneProven: true, hostedSecurityProof: true,
      adapters: {
        lookupScope: async () => ({ workspaceId: "workspace-1", projectId: "project-1" }), checkDurableControlPlane: async () => true, checkHostedSecurity: async () => true,
        readProviderHealth: async () => ({ status: "available", checkedAt: new Date().toISOString() }), hasActiveAttempt: async () => null, requestDispatch: dispatch,
      },
    });
    expect(result.kind).toBe("DISPATCH_READY");
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});