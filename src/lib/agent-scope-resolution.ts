export type ControlPlaneScope = Readonly<{
  actorId: string;
  workspaceId: string;
  projectId: string;
}>;

export type ScopeLookup = (actorId: string) => Promise<Readonly<{ workspaceId: string; projectId: string }> | null>;

export type ScopeResolutionErrorCode = "AUTHENTICATION_REQUIRED" | "SCOPE_MISMATCH" | "UNKNOWN";

export class ScopeResolutionError extends Error {
  constructor(public readonly code: ScopeResolutionErrorCode, message: string) {
    super(message);
    this.name = "ScopeResolutionError";
  }
}

/**
 * Resolve scope only from authenticated server identity plus authoritative
 * application membership. There is deliberately no infrastructure-id fallback.
 */
export async function resolveAuthoritativeAgentScope(
  authenticatedActorId: string | null | undefined,
  lookup: ScopeLookup,
): Promise<ControlPlaneScope> {
  const actorId = authenticatedActorId?.trim();
  if (!actorId) throw new ScopeResolutionError("AUTHENTICATION_REQUIRED", "authenticated actor identity is required");

  const membership = await lookup(actorId);
  if (!membership) throw new ScopeResolutionError("SCOPE_MISMATCH", "no authoritative workspace/project scope exists for the authenticated actor");

  const workspaceId = membership.workspaceId.trim();
  const projectId = membership.projectId.trim();
  if (!workspaceId || !projectId) throw new ScopeResolutionError("SCOPE_MISMATCH", "authoritative workspace and project scope are both required");

  return { actorId, workspaceId, projectId };
}

export function assertScopeMatch(
  resolved: ControlPlaneScope,
  expected: Readonly<{ workspaceId: string; projectId: string }>,
): void {
  if (resolved.workspaceId !== expected.workspaceId || resolved.projectId !== expected.projectId) {
    throw new ScopeResolutionError("SCOPE_MISMATCH", "execution scope does not match authoritative task scope");
  }
}