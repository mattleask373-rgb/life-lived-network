/**
 * Provider-neutral identity and approval contract for the agent control plane.
 *
 * This is a pure validation seam. It does not authenticate callers itself and
 * must never be treated as proof of authentication. The durable/service
 * boundary must bind these values to a verified identity before execution.
 */

export type AgentAction =
  | "claim"
  | "heartbeat"
  | "execute"
  | "verify"
  | "review"
  | "integrate"
  | "cancel"
  | "external-side-effect"
  | "merge"
  | "deploy";

export type AgentRisk = "P0" | "P1" | "P2" | "P3";

export interface AgentIdentity {
  actorId: string;
  agentId: string;
  runId: string;
  workspaceId: string;
  projectId: string;
}

export interface HumanApproval {
  approvalId: string;
  approverId: string;
  workspaceId: string;
  projectId: string;
  taskId: string;
  action: AgentAction;
  issuedAt: string;
  expiresAt: string;
}

export interface AgentActionRequest {
  identity: AgentIdentity;
  taskId: string;
  action: AgentAction;
  risk: AgentRisk;
  reversible: boolean;
  requiresHumanGate: boolean;
  approval?: HumanApproval;
}

export interface IdentityValidation {
  valid: boolean;
  errors: string[];
}

const ACTIONS = new Set<AgentAction>([
  "claim",
  "heartbeat",
  "execute",
  "verify",
  "review",
  "integrate",
  "cancel",
  "external-side-effect",
  "merge",
  "deploy",
]);

const RISKS = new Set<AgentRisk>(["P0", "P1", "P2", "P3"]);

const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

function parseDate(value: string): number {
  return Date.parse(value);
}

export function requiresHumanApproval(
  request: Pick<AgentActionRequest, "risk" | "reversible" | "requiresHumanGate" | "action">,
): boolean {
  return (
    request.requiresHumanGate ||
    request.risk === "P0" ||
    request.risk === "P1" ||
    !request.reversible ||
    request.action === "external-side-effect" ||
    request.action === "merge" ||
    request.action === "deploy"
  );
}

export function validateAgentIdentity(identity: unknown): IdentityValidation {
  const errors: string[] = [];
  if (!identity || typeof identity !== "object") {
    return { valid: false, errors: ["identity must be an object"] };
  }

  const value = identity as AgentIdentity;
  if (!nonEmpty(value.actorId)) errors.push("actorId is required");
  if (!nonEmpty(value.agentId)) errors.push("agentId is required");
  if (!nonEmpty(value.runId)) errors.push("runId is required");
  if (!nonEmpty(value.workspaceId)) errors.push("workspaceId is required");
  if (!nonEmpty(value.projectId)) errors.push("projectId is required");

  return { valid: errors.length === 0, errors };
}

export function validateHumanApproval(
  approval: unknown,
  request: Pick<AgentActionRequest, "identity" | "taskId" | "action">,
  now = new Date(),
): IdentityValidation {
  const errors: string[] = [];
  if (!approval || typeof approval !== "object") {
    return { valid: false, errors: ["human approval is required"] };
  }

  const value = approval as HumanApproval;
  if (!nonEmpty(value.approvalId)) errors.push("approvalId is required");
  if (!nonEmpty(value.approverId)) errors.push("approverId is required");
  if (!nonEmpty(value.workspaceId)) errors.push("approval workspaceId is required");
  if (!nonEmpty(value.projectId)) errors.push("approval projectId is required");
  if (!nonEmpty(value.taskId)) errors.push("approval taskId is required");
  if (!ACTIONS.has(value.action)) errors.push("approval action is invalid");
  if (!nonEmpty(value.issuedAt)) errors.push("issuedAt is required");
  if (!nonEmpty(value.expiresAt)) errors.push("expiresAt is required");

  if (
    nonEmpty(value.workspaceId) &&
    value.workspaceId !== request.identity.workspaceId
  ) {
    errors.push("approval workspace does not match action workspace");
  }
  if (nonEmpty(value.projectId) && value.projectId !== request.identity.projectId) {
    errors.push("approval project does not match action project");
  }
  if (nonEmpty(value.taskId) && value.taskId !== request.taskId) {
    errors.push("approval task does not match action task");
  }
  if (ACTIONS.has(value.action) && value.action !== request.action) {
    errors.push("approval action does not match requested action");
  }

  const issued = nonEmpty(value.issuedAt) ? parseDate(value.issuedAt) : NaN;
  const expires = nonEmpty(value.expiresAt) ? parseDate(value.expiresAt) : NaN;
  if (!Number.isFinite(issued) || !Number.isFinite(expires)) {
    errors.push("approval timestamps must be valid ISO dates");
  } else if (expires <= issued) {
    errors.push("approval must expire after it is issued");
  } else if (expires <= now.getTime()) {
    errors.push("approval has expired");
  } else if (issued > now.getTime()) {
    errors.push("approval cannot be issued in the future");
  }

  if (nonEmpty(value.approverId) && value.approverId === request.identity.actorId) {
    errors.push("agent actor cannot self-approve its own action");
  }

  return { valid: errors.length === 0, errors };
}

export function validateAgentActionRequest(
  request: unknown,
  now = new Date(),
): IdentityValidation {
  const errors: string[] = [];
  if (!request || typeof request !== "object") {
    return { valid: false, errors: ["request must be an object"] };
  }

  const value = request as AgentActionRequest;
  const identityResult = validateAgentIdentity(value.identity);
  errors.push(...identityResult.errors);

  if (!nonEmpty(value.taskId)) errors.push("taskId is required");
  if (!ACTIONS.has(value.action)) errors.push("action is invalid");
  if (!RISKS.has(value.risk)) errors.push("risk is invalid");
  if (typeof value.reversible !== "boolean") errors.push("reversible is required");
  if (typeof value.requiresHumanGate !== "boolean") {
    errors.push("requiresHumanGate is required");
  }

  const gateRequired =
    typeof value.reversible === "boolean" &&
    typeof value.requiresHumanGate === "boolean" &&
    ACTIONS.has(value.action) &&
    RISKS.has(value.risk) &&
    requiresHumanApproval(value);

  if (gateRequired) {
    if (!value.approval) {
      errors.push("human approval is required for this action");
    } else {
      errors.push(
        ...validateHumanApproval(value.approval, value, now).errors,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
