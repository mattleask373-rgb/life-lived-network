/**
 * Work routing — assign a task to eligible specialist roles without collisions.
 * Uses role contracts + optional active claims (path overlap).
 */

import type { AgentRoleContract, RoleCapability } from "./agent-role-contract";
import type { RiskLevel } from "./agent-orchestration";

export interface RoutableTask {
  taskId: string;
  objective: string;
  requiredCapabilities: RoleCapability[];
  risk: RiskLevel;
  scopeIn: string[];
  /** Paths already claimed by other active tasks. */
  blockedPaths?: string[];
}

export interface RoutingDecision {
  eligible: AgentRoleContract[];
  recommended: AgentRoleContract | null;
  rejected: Array<{ roleId: string; reason: string }>;
}

const RISK_RANK: Record<RiskLevel, number> = {
  P3: 0,
  P2: 1,
  P1: 2,
  P0: 3,
};

function pathConflicts(scopeIn: string[], blocked: string[]): boolean {
  if (!blocked.length || !scopeIn.length) return false;
  for (const s of scopeIn) {
    for (const b of blocked) {
      if (s === b || s.startsWith(b) || b.startsWith(s)) return true;
    }
  }
  return false;
}

export function routeTask(
  task: RoutableTask,
  roster: readonly AgentRoleContract[],
): RoutingDecision {
  const rejected: RoutingDecision["rejected"] = [];
  const eligible: AgentRoleContract[] = [];

  for (const role of roster) {
    const missing = task.requiredCapabilities.filter((c) => !role.capabilities.includes(c));
    if (missing.length > 0) {
      rejected.push({
        roleId: role.id,
        reason: `missing capabilities: ${missing.join(", ")}`,
      });
      continue;
    }
    if (
      RISK_RANK[task.risk] > RISK_RANK[role.maxRiskWithoutHumanGate] &&
      role.id !== "security_privacy"
    ) {
      // High-risk tasks still route to security; others need human-capable path
      if (task.risk === "P0" && !role.humanGates.length) {
        rejected.push({
          roleId: role.id,
          reason: "P0 risk exceeds role ceiling without human gates",
        });
        continue;
      }
    }
    const scope = task.scopeIn.length ? task.scopeIn : role.defaultScopeIn;
    if (pathConflicts(scope, task.blockedPaths ?? [])) {
      rejected.push({ roleId: role.id, reason: "path conflict with active claim" });
      continue;
    }
    eligible.push(role);
  }

  // Prefer more specific implementation roles over orchestrator when both eligible
  const preferred = [...eligible].sort((a, b) => {
    const aImpl = a.capabilities.includes("implementation") ? 0 : 1;
    const bImpl = b.capabilities.includes("implementation") ? 0 : 1;
    if (aImpl !== bImpl) return aImpl - bImpl;
    return a.id.localeCompare(b.id);
  });

  return {
    eligible,
    recommended: preferred[0] ?? null,
    rejected,
  };
}
