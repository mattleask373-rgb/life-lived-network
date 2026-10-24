import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./needs.functions.ts", import.meta.url), "utf8");
const sharedStart = source.indexOf("async function findSupplyForNeedWithClient");
const publicStart = source.indexOf("export const findSupplyForNeed =");
const memberStart = source.indexOf("export const findSupplyForNeedForMember", publicStart);
const end = source.indexOf("/** Turn stored photo paths into short-lived links.", memberStart);
const shared = source.slice(sharedStart, publicStart);
const publicEndpoint = source.slice(publicStart, memberStart);
const memberEndpoint = source.slice(memberStart, end);

describe("public need-to-supply boundary", () => {
  it("uses an anonymous client and enforces public-only visibility before the read", () => {
    expect(sharedStart).toBeGreaterThanOrEqual(0);
    expect(publicStart).toBeGreaterThan(sharedStart);
    expect(memberStart).toBeGreaterThan(publicStart);
    expect(end).toBeGreaterThan(memberStart);
    expect(publicEndpoint).toContain(
      'const { publicServerClient } = await import("./supabase-public.server")',
    );
    expect(publicEndpoint).toContain(
      "findSupplyForNeedWithClient(data.needId, publicServerClient(), true)",
    );
    expect(shared).toContain('.eq("id", needId)');
    expect(shared).toContain('if (publicOnly) needQuery = needQuery.eq("visibility", "public");');
    expect(shared.indexOf("if (publicOnly)")).toBeLessThan(shared.indexOf(".maybeSingle()"));
  });

  it("short-circuits an absent or inaccessible need before matching or elevated operations", () => {
    const noNeed = shared.indexOf("if (!needRow) return null;");
    expect(noNeed).toBeGreaterThan(shared.indexOf(".maybeSingle()"));
    for (const nextStage of [
      "const { loadPlaceIndex }",
      "const { supabaseAdmin }",
      "await signPhotos(",
      "return findSupply(",
    ]) {
      const stageIndex = shared.indexOf(nextStage);
      expect(stageIndex).toBeGreaterThan(noNeed);
    }
  });

  it("uses request-scoped RLS for signed-in reads and does not elevate discovery queries", () => {
    expect(memberEndpoint).toContain(".middleware([requireSupabaseAuth])");
    expect(memberEndpoint).toContain(
      "findSupplyForNeedWithClient(data.needId, context.supabase, false)",
    );
    expect(memberEndpoint).not.toContain("publicServerClient");
    expect(shared.includes('supabaseAdmin.from("needs")')).toBe(false);
    expect(shared.includes('supabaseAdmin.from("person_capabilities")')).toBe(false);
  });
  it("requires exact-count bounded reads for every source used to generate a supply match", () => {
    expect(shared).toContain("requireCompleteQueryRows");
    expect(shared).toContain('requireCompleteQueryRows(listingResult, "listing candidates", 150)');
    expect(shared).toContain('requireCompleteQueryRows(hourResult, "hour-offer candidates", 150)');
    expect(shared).toContain('count: "exact"');
    expect(shared).toContain('hourQuery = hourQuery.in("place_id", localIds)');
    expect(shared).not.toContain("const { data: listingRows } = await listingQuery");
    expect(shared).not.toContain("const { data: hourRows } = await supabase");
    for (const fact of [
      '"candidate profiles"',
      '"candidate capabilities"',
      '"candidate service areas"',
      '"candidate availability"',
      '"candidate preferences"',
      '"candidate contribution preferences"',
      '"candidate journeys"',
    ]) {
      expect(shared).toContain(fact);
    }
  });
  it("fails closed when the canonical place is missing before any supply query", () => {
    const loadIndex = shared.indexOf("const placeIndex = await loadPlaceIndex(supabase);");
    const guard = shared.indexOf(
      'throw new DataError("INVALID_CONTEXT", "Need has no resolvable canonical locality.");',
    );
    const firstCandidateRead = shared.indexOf('.from("profiles")');
    const listingRead = shared.indexOf('.from("listings")');
    expect(loadIndex).toBeGreaterThanOrEqual(0);
    expect(guard).toBeGreaterThan(loadIndex);
    expect(firstCandidateRead).toBeGreaterThan(guard);
    expect(listingRead).toBeGreaterThan(guard);
    expect(shared).toContain("!placeIndex.byId.has(geo.placeId)");
  });
});
