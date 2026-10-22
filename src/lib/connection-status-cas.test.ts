import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./connection.functions.ts", import.meta.url), "utf8");

describe("connection status concurrency guard", () => {
  it("updates only if the status still matches the state checked before the write", () => {
    const moveHandler = source.slice(
      source.indexOf("export const moveConnectionRequest"),
      source.indexOf("/** Everything you're part of", source.indexOf("export const moveConnectionRequest")),
    );

    expect(moveHandler).toMatch(/\.update\(\{ status: data\.status \}\)[\s\S]*?\.eq\("id", data\.id\)[\s\S]*?\.eq\("status", request\.status\)[\s\S]*?\.maybeSingle\(\)/);
    expect(moveHandler).toContain("This request changed before your update could be saved");
  });
});
