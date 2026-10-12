import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

describe("private route authentication guards", () => {
  it("ensures every sensitive private route file exists", () => {
    const routeFiles = [
      "src/routes/profile.tsx",
      "src/routes/memories.tsx",
      "src/routes/conversations.tsx",
      "src/routes/moderation.tsx",
      "src/routes/sources.tsx",
    ];
    for (const file of routeFiles) {
      expect(existsSync(resolve(file))).toBe(true);
    }
  });

  it("ensures profile route guards queries and prevents unauthenticated data rendering", () => {
    const src = readFileSync(resolve("src/routes/profile.tsx"), "utf8");
    // Verify useSession hook is utilized
    expect(src).toContain("useSession");
    // Verify redirect effect to /auth for unauthenticated users
    expect(src).toMatch(
      /if\s*\(\s*ready\s*&&\s*!user\s*\)\s*void\s*navigate\(\{\s*to:\s*["']\/auth["']/,
    );
    // Verify database fetch is strictly guarded on user existing
    expect(src).toContain("if (!user) return;");
    // Verify unauthenticated render guard returns blank/loading container rather than profile form
    expect(src).toMatch(/if\s*\(!user\)\s*return\s*<main/);
  });

  it("ensures memories route guards private place memories behind session check", () => {
    const src = readFileSync(resolve("src/routes/memories.tsx"), "utf8");
    expect(src).toContain("useSession");
    // Verify session guard branch before rendering Memories
    expect(src).toContain("!session ?");
    expect(src).toContain("Sign in to keep a private record");
    expect(src).toContain("<Memories />");
  });

  it("ensures conversations route guards conversation query on user", () => {
    const src = readFileSync(resolve("src/routes/conversations.tsx"), "utf8");
    expect(src).toContain("useSession");
    expect(src).toMatch(/enabled:\s*Boolean\(user\)/);
    expect(src).toContain("Sign in");
  });

  it("ensures moderation and sources routes enforce reviewer role", () => {
    const modSrc = readFileSync(resolve("src/routes/moderation.tsx"), "utf8");
    expect(modSrc).toContain("useSession");
    expect(modSrc).toMatch(/if\s*\(ready\s*&&\s*!user\)/);
    expect(modSrc).toContain("You need to sign in to reach this.");
    expect(modSrc).toMatch(/enabled:\s*reviewer/);

    const sourcesSrc = readFileSync(resolve("src/routes/sources.tsx"), "utf8");
    expect(sourcesSrc).toContain("useSession");
    expect(sourcesSrc).toMatch(/if\s*\(!user\s*\|\|\s*\(role\.isFetched\s*&&\s*!reviewer\)\)/);
    expect(sourcesSrc).toContain("This is not open to you.");
  });
});
