import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./needs.functions.ts", import.meta.url), "utf8");
const start = source.indexOf("export const findSupplyForNeed =");
const end = source.indexOf("export const getMyOpportunities =", start);
const endpoint = source.slice(start, end);

describe("public need-to-supply boundary", () => {
  it("requires explicit public visibility in addition to anonymous RLS", () => {
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(endpoint).toContain(
      'const { publicServerClient } = await import("./supabase-public.server")',
    );
    expect(endpoint).toContain('.eq("id", data.needId)');
    expect(endpoint).toContain('.eq("visibility", "public")');
    expect(endpoint.indexOf('.eq("visibility", "public")')).toBeLessThan(
      endpoint.indexOf(".maybeSingle()"),
    );
  });

  it("short-circuits an absent/non-public need before any matching or privileged operations", () => {
    const noNeed = endpoint.indexOf("if (!needRow) return null;");
    expect(noNeed).toBeGreaterThan(endpoint.indexOf(".maybeSingle()"));
    for (const nextStage of [
      "const { loadPlaceIndex }",
      "const { supabaseAdmin }",
      "await signPhotos(",
      "return findSupply(",
    ]) {
      const stageIndex = endpoint.indexOf(nextStage);
      expect(stageIndex).toBeGreaterThan(noNeed);
    }
  });
});
