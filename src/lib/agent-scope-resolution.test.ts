import { describe, expect, it } from "vitest";
import { assertScopeMatch, resolveAuthoritativeAgentScope, ScopeResolutionError } from "./agent-scope-resolution";

describe("authoritative agent scope resolution", () => {
  it("resolves scope only from authenticated identity plus authoritative lookup", async () => {
    await expect(resolveAuthoritativeAgentScope("actor-1", async (actorId) => ({
      workspaceId: "workspace-for-" + actorId, projectId: "project-1",
    }))).resolves.toEqual({ actorId: "actor-1", workspaceId: "workspace-for-actor-1", projectId: "project-1" });
  });

  it("rejects missing authentication", async () => {
    await expect(resolveAuthoritativeAgentScope(" ", async () => ({ workspaceId: "w", projectId: "p" })))
      .rejects.toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
  });

  it("fails closed when no application scope authority exists", async () => {
    await expect(resolveAuthoritativeAgentScope("actor-1", async () => null))
      .rejects.toMatchObject({ code: "SCOPE_MISMATCH" });
  });

  it("rejects incomplete scope rather than manufacturing a fallback", async () => {
    await expect(resolveAuthoritativeAgentScope("actor-1", async () => ({ workspaceId: "workspace-1", projectId: " " })))
      .rejects.toMatchObject({ code: "SCOPE_MISMATCH" });
  });

  it("does not accept infrastructure project identifiers as scope", async () => {
    await expect(resolveAuthoritativeAgentScope("actor-1", async () => null)).rejects.toBeInstanceOf(ScopeResolutionError);
  });

  it("rejects cross-scope task execution", async () => {
    const resolved = await resolveAuthoritativeAgentScope("actor-1", async () => ({ workspaceId: "workspace-1", projectId: "project-1" }));
    expect(() => assertScopeMatch(resolved, { workspaceId: "workspace-2", projectId: "project-1" }))
      .toThrowError("execution scope does not match authoritative task scope");
  });

  it("accepts exact authoritative scope match", async () => {
    const resolved = await resolveAuthoritativeAgentScope("actor-1", async () => ({ workspaceId: "workspace-1", projectId: "project-1" }));
    expect(() => assertScopeMatch(resolved, { workspaceId: "workspace-1", projectId: "project-1" })).not.toThrow();
  });
});