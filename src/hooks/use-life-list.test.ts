import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hookSource = readFileSync(new URL("./use-life-list.ts", import.meta.url), "utf8");

describe("Life List account-read safety contracts", () => {
  it("filters signed-in reads by the currently authenticated user as defense in depth", () => {
    expect(hookSource).toMatch(
      /\.select\("ref, category"\)\s*\.eq\("user_id", userId\)/,
    );
  });

  it("keeps local items until the account confirms a successful merge", () => {
    const failedSync = hookSource.indexOf("if (syncError) throw syncError;");
    const clearLocal = hookSource.indexOf("writeLifeList([]);");

    expect(failedSync).toBeGreaterThan(-1);
    expect(clearLocal).toBeGreaterThan(failedSync);
  });

  it("distinguishes read/session failure from a valid empty account list", () => {
    expect(hookSource).toContain("if (sessionError)");
    expect(hookSource).toContain("if (readError) throw readError;");
    expect(hookSource).toContain('if (data === null) throw new Error("The saved list response was incomplete.");');
    expect(hookSource).toContain("setLoadError(true);");
  });

  it("ignores responses from previous account reads and retries", () => {
    expect(hookSource).toContain("const isCurrent = () => generation.current === request;");
    expect(hookSource).toContain("generation.current += 1;");
  });
});
