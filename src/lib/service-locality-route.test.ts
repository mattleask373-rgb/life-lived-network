import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

describe("service + locality route registration", () => {
  it("has the file-backed route and the generated route declaration", () => {
    expect(existsSync("src/routes/$country.$place.$service.tsx")).toBe(true);
    const tree = readFileSync("src/routeTree.gen.ts", "utf8");
    // The router generator may encode the final segment as a child path.
    // Assert registration, not a brittle representation of path metadata.
    expect(tree).toContain("CountryPlaceServiceRouteImport");
    expect(tree).toContain("CountryPlaceServiceRoute: typeof CountryPlaceServiceRoute");
  });
});
