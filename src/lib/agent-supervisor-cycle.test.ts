import { describe, expect, it, vi } from "vitest";
import { runBoundedSupervisorCycle } from "./agent-supervisor-cycle";
import type { OperationalProvider } from "./agent-operations-gate";

const task = { task_id: "task-1", autonomy: "L2" as const, risk: "P3" as const, lane: "IMPLEMENTATION" as const };
const provider: OperationalProvider = { id: "grok", capabilities: ["implementation","research","review","qa","security_audit"], maxAutonomy: "L2" };

describe("bounded supervisor cycle", () => {
  it("stops before dispatch when scope authority is missing", async () => {
    const dispatch = vi.fn();
    const result = await runBoundedSupervisorCycle({ actorId: "actor-1", task, provider, providerPolicy: { requireHumanFor: ["P0","P1"], excludeProviders: [] }, adapters: { lookupScope: async () => null, checkDurableControlPlane: async () => ({ status: "PROVEN" as const, evidenceRef: "test:durable", checkedAt: "2026-10-08T17:00:00Z" }), checkHostedSecurity: async () => ({ status: "PROVEN" as const, evidenceRef: "test:hosted", checkedAt: "2026-10-08T17:00:00Z" }), readProviderHealth: async () => ({ status: "available", checkedAt: "2026-10-08T17:00:00Z" }), hasActiveAttempt: async () => null, requestDispatch: dispatch } });
    expect(result.kind).toBe("HOLD"); expect(result.reason).toContain("no authoritative workspace/project scope"); expect(dispatch).not.toHaveBeenCalled();
  });
  it("dispatches only after all evidence-backed proof gates pass", async () => {
    const dispatch = vi.fn();
    const result = await runBoundedSupervisorCycle({ actorId: "actor-1", task, provider, providerPolicy: { requireHumanFor: ["P0","P1"], excludeProviders: [] }, adapters: { lookupScope: async () => ({ workspaceId: "workspace-1", projectId: "project-1" }), checkDurableControlPlane: async () => ({ status: "PROVEN" as const, evidenceRef: "test:durable", checkedAt: "2026-10-08T17:00:00Z" }), checkHostedSecurity: async () => ({ status: "PROVEN" as const, evidenceRef: "test:hosted", checkedAt: "2026-10-08T17:00:00Z" }), readProviderHealth: async () => ({ status: "available", checkedAt: "2026-10-08T17:00:00Z" }), hasActiveAttempt: async () => null, requestDispatch: dispatch } });
    expect(result.kind).toBe("DISPATCH_READY"); expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
