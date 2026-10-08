import { describe, expect, it } from "vitest";
import { decideRunBootstrap, unprovenProjectScope } from "./agent-run-bootstrap";

describe("authenticated run bootstrap", () => {
  const base = {
    authenticatedSessionActorId: "user-session-1",
    serverGeneratedRunId: "11111111-1111-1111-1111-111111111111",
    scope: {
      kind: "PROVEN" as const,
      workspaceId: "ws-1",
      projectId: "proj-1",
      source: "membership-table",
    },
  };

  it("creates a run when session actor and proven scope exist", () => {
    const d = decideRunBootstrap(base);
    expect(d.kind).toBe("CREATE_RUN");
    if (d.kind === "CREATE_RUN") {
      expect(d.actorId).toBe("user-session-1");
      expect(d.productionLive).toBe(false);
      expect(d.runId).toBe(base.serverGeneratedRunId);
    }
  });

  it("rejects forged client actor", () => {
    const d = decideRunBootstrap({
      ...base,
      request: { claimedActorId: "admin" },
    });
    expect(d).toMatchObject({ kind: "HOLD", code: "ACTOR_FORGERY" });
  });

  it("holds when project authority is not proven", () => {
    const d = decideRunBootstrap({
      ...base,
      scope: unprovenProjectScope(),
    });
    expect(d).toMatchObject({ kind: "HOLD", code: "AUTHORITY_NOT_PROVEN" });
  });

  it("rejects productionLive true", () => {
    const d = decideRunBootstrap({ ...base, productionLive: true });
    expect(d).toMatchObject({ kind: "HOLD", code: "PRODUCTION_BOUNDARY" });
  });

  it("rejects mismatched client project hint", () => {
    const d = decideRunBootstrap({
      ...base,
      request: { clientProjectHint: "other-proj" },
    });
    expect(d).toMatchObject({ kind: "HOLD", code: "SCOPE_MISMATCH" });
  });

  it("rejects missing session actor", () => {
    const d = decideRunBootstrap({
      ...base,
      authenticatedSessionActorId: "",
    });
    expect(d).toMatchObject({ kind: "HOLD", code: "AUTHENTICATION_REQUIRED" });
  });
});
