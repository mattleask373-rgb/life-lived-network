/**
 * Authenticated execution-run bootstrap (pure policy).
 *
 * Actor identity must come from the trusted server auth boundary
 * (e.g. requireSupabaseAuth → claims.sub). Client-supplied actor_id,
 * run_id, workspace_id, or project_id are never authoritative.
 *
 * Project scope: if no proven authority source exists, HOLD with
 * AUTHORITY_NOT_PROVEN rather than inventing a tenant.
 */

export type ScopeAuthority =
  | Readonly<{ kind: "PROVEN"; workspaceId: string; projectId: string; source: string }>
  | Readonly<{ kind: "AUTHORITY_NOT_PROVEN"; reason: string }>;

export type RunBootstrapRequest = Readonly<{
  /** Must equal authenticatedSessionActorId — never taken from client body as authority. */
  claimedActorId?: string;
  /** Client may request a label only; never a run id. */
  requestedLabel?: string;
  /** Optional client-hint workspace — must match proven scope if provided. */
  clientWorkspaceHint?: string;
  /** Optional client-hint project — must match proven scope if provided. */
  clientProjectHint?: string;
}>;

export type RunBootstrapInput = Readonly<{
  /** claims.sub (or equivalent) from requireSupabaseAuth. */
  authenticatedSessionActorId: string;
  /** Server-generated UUID — never client-supplied. */
  serverGeneratedRunId: string;
  /** Result of resolving workspace/project from authoritative tables/claims. */
  scope: ScopeAuthority;
  request?: RunBootstrapRequest;
  /** Always false until human activation. */
  productionLive?: boolean;
}>;

export type RunBootstrapDecision =
  | Readonly<{
      kind: "CREATE_RUN";
      actorId: string;
      runId: string;
      workspaceId: string;
      projectId: string;
      requestedLabel?: string;
      productionLive: false;
      reason: string;
    }>
  | Readonly<{ kind: "HOLD"; code: string; reason: string }>;

export function decideRunBootstrap(input: RunBootstrapInput): RunBootstrapDecision {
  const actor = input.authenticatedSessionActorId?.trim() ?? "";
  if (!actor) {
    return {
      kind: "HOLD",
      code: "AUTHENTICATION_REQUIRED",
      reason: "authenticated session actor (claims.sub) is required",
    };
  }

  if (input.request?.claimedActorId && input.request.claimedActorId.trim() !== actor) {
    return {
      kind: "HOLD",
      code: "ACTOR_FORGERY",
      reason: "client-claimed actor_id does not match authenticated session",
    };
  }

  const runId = input.serverGeneratedRunId?.trim() ?? "";
  if (!runId) {
    return {
      kind: "HOLD",
      code: "MISSING_RUN",
      reason: "server-generated run_id is required",
    };
  }

  // Client must never supply run identity as authority.
  if (input.productionLive === true) {
    return {
      kind: "HOLD",
      code: "PRODUCTION_BOUNDARY",
      reason: "productionLive remains false until human activation checklist",
    };
  }

  if (input.scope.kind === "AUTHORITY_NOT_PROVEN") {
    return {
      kind: "HOLD",
      code: "AUTHORITY_NOT_PROVEN",
      reason: input.scope.reason,
    };
  }

  const { workspaceId, projectId, source } = input.scope;
  if (!workspaceId.trim() || !projectId.trim()) {
    return {
      kind: "HOLD",
      code: "SCOPE_MISMATCH",
      reason: "proven scope must include non-empty workspaceId and projectId",
    };
  }

  if (
    input.request?.clientWorkspaceHint &&
    input.request.clientWorkspaceHint.trim() !== workspaceId
  ) {
    return {
      kind: "HOLD",
      code: "SCOPE_MISMATCH",
      reason: "client workspace hint does not match authoritative workspace",
    };
  }

  if (
    input.request?.clientProjectHint &&
    input.request.clientProjectHint.trim() !== projectId
  ) {
    return {
      kind: "HOLD",
      code: "SCOPE_MISMATCH",
      reason: "client project hint does not match authoritative project",
    };
  }

  return {
    kind: "CREATE_RUN",
    actorId: actor,
    runId,
    workspaceId,
    projectId,
    requestedLabel: input.request?.requestedLabel?.trim() || undefined,
    productionLive: false,
    reason: `authenticated run bootstrap from session; scope source=${source}`,
  };
}

/**
 * Helper for adapters: until an authoritative project/workspace membership
 * table is proven, always return AUTHORITY_NOT_PROVEN.
 */
export function unprovenProjectScope(reason?: string): ScopeAuthority {
  return {
    kind: "AUTHORITY_NOT_PROVEN",
    reason:
      reason ??
      "No authoritative project/workspace membership source verified in repository; refuse to invent tenant scope",
  };
}
