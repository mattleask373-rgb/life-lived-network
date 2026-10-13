import { afterEach, describe, expect, it, vi } from "vitest";

import { fixturesAllowed } from "./fixtures-policy.server";

afterEach(() => vi.unstubAllEnvs());

describe("fixturesAllowed", () => {
  it("is always off in production, even if the flag says true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("WORLD_FIXTURES", "true");
    expect(fixturesAllowed()).toBe(false);
  });

  it("is on in development unless explicitly switched off", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("WORLD_FIXTURES", "");
    expect(fixturesAllowed()).toBe(true);
    vi.stubEnv("WORLD_FIXTURES", "false");
    expect(fixturesAllowed()).toBe(false);
  });
});
