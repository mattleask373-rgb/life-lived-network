import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

describe("service + locality route registration", () => {
  it("has the file-backed route and the generated route declaration", () => {
    expect(existsSync("src/routes/$country.$place.$service.tsx")).toBe(true);
    const tree = readFileSync("src/routeTree.gen.ts", "utf8");
    expect(tree).toContain("path: '/$country/$place/$service'");
    expect(tree).toContain("fullPath: '/$country/$place/$service'");
  });
});
