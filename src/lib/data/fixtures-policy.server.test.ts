import { afterEach, describe, expect, it, vi } from "vitest";

import { fixturesAllowed } from "./fixtures-policy.server";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("demonstration fixture policy", () => {
  it("never allows fixtures in production by default", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("WORLD_FIXTURES", "");
    expect(fixturesAllowed()).toBe(false);
  });

  it("never allows fixtures in production even when explicitly enabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("WORLD_FIXTURES", "true");
    expect(fixturesAllowed()).toBe(false);
  });

  it("allows fixtures in development by default", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("WORLD_FIXTURES", "");
    expect(fixturesAllowed()).toBe(true);
  });

  it("honours an explicit development opt-out", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("WORLD_FIXTURES", "false");
    expect(fixturesAllowed()).toBe(false);
  });

  it("honours an explicit development opt-in", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("WORLD_FIXTURES", "true");
    expect(fixturesAllowed()).toBe(true);
  });
});
