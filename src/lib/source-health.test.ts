import { describe, expect, it } from "vitest";
import { sourceHealth, type SourceHealthInput } from "./source-health";

const NOW = new Date("2026-10-21T12:00:00.000Z");

function input(overrides: Partial<SourceHealthInput> = {}): SourceHealthInput {
  return {
    enabled: true,
    status: "ready",
    credentialRequired: false,
    credentialPresent: true,
    refreshMinutes: 15,
    lastRunAt: "2026-10-21T11:45:00.000Z",
    lastSuccessAt: "2026-10-21T11:55:00.000Z",
    consecutiveFailures: 0,
    now: NOW,
    ...overrides,
  };
}

describe("sourceHealth", () => {
  it("reports a recent successful refresh within its interval", () => {
    expect(sourceHealth(input()).state).toBe("current");
  });

  it("reports when a refresh is due", () => {
    expect(sourceHealth(input({ lastSuccessAt: "2026-10-21T11:40:00.000Z" })).state).toBe("due");
  });

  it("reports when a source is overdue by more than three intervals", () => {
    expect(sourceHealth(input({ lastSuccessAt: "2026-10-21T10:30:00.000Z" })).state).toBe(
      "overdue",
    );
  });

  it("prioritises a disabled source over its previous refresh time", () => {
    expect(sourceHealth(input({ enabled: false, consecutiveFailures: 2 })).state).toBe("paused");
  });

  it("flags a source that needs configuration or credentials", () => {
    expect(sourceHealth(input({ status: "requires_review" })).state).toBe("needs_setup");
    expect(sourceHealth(input({ credentialRequired: true, credentialPresent: false })).state).toBe(
      "needs_setup",
    );
  });

  it("reports consecutive failures without claiming old records changed", () => {
    const health = sourceHealth(input({ consecutiveFailures: 2 }));
    expect(health.state).toBe("failing");
    expect(health.explanation).toContain("existing records are left unchanged");
  });

  it("distinguishes never attempted from attempted without success", () => {
    expect(sourceHealth(input({ lastRunAt: null, lastSuccessAt: null })).state).toBe(
      "never_checked",
    );
    expect(
      sourceHealth(input({ lastRunAt: "2026-10-21T11:50:00.000Z", lastSuccessAt: null })).state,
    ).toBe("never_succeeded");
  });

  it("fails closed for an invalid or future success timestamp", () => {
    expect(sourceHealth(input({ lastSuccessAt: "not-a-time" })).state).toBe("unknown");
    expect(sourceHealth(input({ lastSuccessAt: "2026-10-21T12:01:00.000Z" })).state).toBe(
      "unknown",
    );
  });
});
