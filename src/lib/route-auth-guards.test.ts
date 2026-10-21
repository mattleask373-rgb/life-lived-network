import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routePath = (name: string) => new URL(`../routes/${name}.tsx`, import.meta.url);
const readRoute = (name: string) => readFileSync(routePath(name), "utf8");

describe("private route authentication guards", () => {
  it("keeps every sensitive route file present", () => {
    for (const route of ["profile", "memories", "conversations", "moderation", "sources"]) {
      expect(existsSync(routePath(route))).toBe(true);
    }
  });

  it("guards profile fetches and renders no profile form before a session exists", () => {
    const src = readRoute("profile");
    expect(src).toContain("useSession");
    expect(src).toMatch(
      /if\s*\(\s*ready\s*&&\s*!user\s*\)\s*void\s*navigate\(\{\s*to:\s*["']\/auth["']/,
    );
    expect(src).toContain("if (!user) return;");
    expect(src).toMatch(/if\s*\(!user\)\s*return\s*<main/);
  });

  it("requires a session before rendering private place memories", () => {
    const src = readRoute("memories");
    expect(src).toContain("useSession");
    expect(src).toContain("!session ?");
    expect(src).toContain("Sign in to keep a private record");
    expect(src).toContain("<Memories />");
  });

  it("does not enable conversation retrieval until a user exists", () => {
    const src = readRoute("conversations");
    expect(src).toContain("useSession");
    expect(src).toMatch(/enabled:\s*Boolean\(user\)/);
    expect(src).toContain("Sign in");
  });

  it("requires an authenticated reviewer for moderation reads", () => {
    const src = readRoute("moderation");
    expect(src).toContain("useSession");
    expect(src).toMatch(/if\s*\(ready\s*&&\s*!user\)/);
    expect(src).toContain("You need to sign in to reach this.");
    expect(src).toMatch(/enabled:\s*reviewer/);
  });

  it("requires a reviewer role for source-management reads", () => {
    const src = readRoute("sources");
    expect(src).toContain("useSession");
    expect(src).toMatch(/if\s*\(!user\s*\|\|\s*\(role\.isFetched\s*&&\s*!reviewer\)\)/);
    expect(src).toContain("This is not open to you.");
  });
});
