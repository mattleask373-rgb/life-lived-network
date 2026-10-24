import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./hours.functions.ts", import.meta.url), "utf8");

describe("open-hours pagination and completeness contract", () => {
  it("uses deterministic lookahead pagination rather than guessing from a full page", () => {
    expect(source).toContain('.order("created_at", { ascending: false })');
    expect(source).toContain('.order("id", { ascending: true })');
    expect(source).toContain(".range(offset, offset + limit)");
    expect(source).toContain("splitPageWithLookahead(completeRows, limit)");
    expect(source).toContain("boundedRows.hasMore");
    expect(source).toContain("toPage(");
  });

  it("fails closed on missing main rows and failed creator-profile enrichment", () => {
    expect(source).toContain('requireQueryRows(rows, error, "Open hours")');
    expect(source).toContain(
      'requireQueryRows(profileRows, profileError, "Open-hours profile")',
    );
    expect(source).not.toContain("rows ?? []");
    expect(source).not.toContain("profiles ?? []");
  });
});
