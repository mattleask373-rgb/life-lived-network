import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

// Guards against the earlier dead end where /need had a child but no outlet,
// so every individual request rendered the blank "What do you need?" form.
describe("request page routing", () => {
  it("keeps the request form and individual requests as siblings", () => {
    expect(existsSync("src/routes/need.tsx")).toBe(false);
    expect(existsSync("src/routes/need.index.tsx")).toBe(true);
    expect(existsSync("src/routes/need.$id.tsx")).toBe(true);
  });
  it("registers both routes", () => {
    const tree = readFileSync("src/routeTree.gen.ts", "utf8");
    expect(tree).toContain("path: '/need/$id'");
    expect(tree).toContain("path: '/need/'");
  });
});
