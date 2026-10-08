import { describe, expect, it } from "vitest";
import { isAuthenticatedExecutionContext, validateAuthenticatedExecutionContext } from "./agent-execution-identity";

describe("authenticated execution identity", () => {
  const valid = { actorId: "actor:1", runId: "run:1", workspaceId: "workspace:1", correlationId: "corr:1" } as const;

  it("accepts a complete identity from a trusted server boundary", () => {
    expect(isAuthenticatedExecutionContext(valid, "trusted-server")).toBe(true);
  });

  it("rejects missing actor/run/scope/correlation", () => {
    const errors = validateAuthenticatedExecutionContext(
      { actorId: "", runId: "", workspaceId: "", correlationId: "" },
      "trusted-server",
    );
    expect(errors.map((error) => error.code)).toEqual([
      "MISSING_ACTOR",
      "MISSING_RUN",
      "MISSING_WORKSPACE",
      "MISSING_CORRELATION",
    ]);
  });

  it("does not treat an arbitrary source as authenticated", () => {
    const errors = validateAuthenticatedExecutionContext(valid, "client-input" as never);
    expect(errors[0]?.code).toBe("UNTRUSTED_IDENTITY_SOURCE");
  });
});
