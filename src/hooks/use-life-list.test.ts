import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const hookSource = readFileSync(new URL("./use-life-list.ts", import.meta.url), "utf8");
const entrySheetSource = readFileSync(
  new URL("../components/entry-sheet.tsx", import.meta.url),
  "utf8",
);

describe("Life List persistence safety contracts", () => {
  it("filters signed-in reads by the currently authenticated user as defense in depth", () => {
    expect(hookSource).toMatch(/\.select\("ref, category"\)\s*\.eq\("user_id", userId\)/);
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
    expect(hookSource).toContain(
      'if (data === null) throw new Error("The saved list response was incomplete.");',
    );
    expect(hookSource).toContain("setLoadError(true);");
  });

  it("ignores responses from previous account reads and retries", () => {
    expect(hookSource).toContain("generation.current += 1;");
    expect(hookSource).toContain("loadGeneration.current += 1;");
    expect(hookSource).toContain("loadGeneration.current === loadRequest");
    expect(hookSource).toContain("sameLifeListIdentity(activeIdentityRef.current, identity)");
  });

  it("serializes mutations and checks signed-in writes before changing local state", () => {
    expect(hookSource).toContain(
      "const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());",
    );
    expect(hookSource).toContain("const handled = operation.catch(() => {");
    expect(hookSource).toContain("const { error } = await supabase");
    expect(hookSource).toContain("if (error) throw error;");
    expect(hookSource).toContain("setWriteError(true);");
    expect(hookSource).toContain("return handled;");
  });

  it("shows an inline failure when saving cannot be persisted", () => {
    expect(entrySheetSource).toContain("const result = await onSave(entry.id);");
    expect(entrySheetSource).toContain("if (result === false) setSaveError(true);");
    expect(entrySheetSource).toContain('role="alert"');
  });

  it("fences queued writes to the account that created the mutation and hides stale account rows", () => {
    expect(hookSource).toContain("const expectedUserId = user?.id ?? null;");
    expect(hookSource).toContain("identity.userId !== expectedUserId");
    expect(hookSource).toContain("itemsOwnerRef.current !== expectedUserId");
    expect(hookSource).toContain("const visibleItems = itemsOwner === activeUserId ? items : [];");
    expect(hookSource).toContain("itemsOwnerRef.current = userId;");
  });

  it("retains guest data until the signed-in list read confirms the merge", () => {
    const merge = hookSource.indexOf("if (syncError) throw syncError;");
    const read = hookSource.indexOf('.select("ref, category")');
    const clear = hookSource.indexOf("if (local.length) writeLifeList([]);");
    expect(merge).toBeGreaterThan(-1);
    expect(read).toBeGreaterThan(merge);
    expect(clear).toBeGreaterThan(read);
  });

  it("keeps write failure separate from read failure and ignores writes after unmount", () => {
    expect(hookSource).toContain("const mounted = useRef(false);");
    expect(hookSource).toContain("!mounted.current ||");
    expect(hookSource).toContain("if (mounted.current && generation.current === request)");
  });
});
