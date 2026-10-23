export type HumanApprovalStatus = "PENDING" | "CONSUMED" | "REVOKED" | "EXPIRED";
export type HumanApproval = Readonly<{
  approvalId: string;
  taskId: string;
  actorId: string;
  workspaceId: string;
  projectId: string;
  issuedByHumanId: string;
  status: HumanApprovalStatus;
  issuedAt: string;
  expiresAt: string;
  consumedAt?: string | null;
}>;

export function validateHumanApproval(approval: HumanApproval, now: Date = new Date()): boolean {
  if (!approval.approvalId.trim() || !approval.taskId.trim() || !approval.actorId.trim()) return false;
  if (!approval.workspaceId.trim() || !approval.projectId.trim() || !approval.issuedByHumanId.trim()) return false;
  if (approval.status !== "PENDING") return false;
  const expiresAt = Date.parse(approval.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= now.getTime()) return false;
  if (approval.consumedAt) return false;
  return true;
}

export function approvalMatchesScope(approval: HumanApproval, scope: Readonly<{ taskId: string; actorId: string; workspaceId: string; projectId: string }>): boolean {
  return approval.taskId === scope.taskId && approval.actorId === scope.actorId && approval.workspaceId === scope.workspaceId && approval.projectId === scope.projectId;
}

/** Pure policy: consumption must be single-use and scoped. Persistence/atomic consume belongs to the durable control plane. */
export function canConsumeHumanApproval(approval: HumanApproval, scope: Readonly<{ taskId: string; actorId: string; workspaceId: string; projectId: string }>, now: Date = new Date()): boolean {
  return validateHumanApproval(approval, now) && approvalMatchesScope(approval, scope);
}