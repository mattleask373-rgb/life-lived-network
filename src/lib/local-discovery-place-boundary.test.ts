import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20261023100000_local_discovery_place_boundary.sql",
    import.meta.url,
  ),
  "utf8",
);
const sqlTest = readFileSync(
  new URL("../../supabase/tests/local_discovery_place_boundary.test.sql", import.meta.url),
  "utf8",
);
const needReaders = readFileSync(new URL("./needs.functions.ts", import.meta.url), "utf8");

describe("local_discovery locality security boundary", () => {
  it("removes the previous broad public SELECT policy and separates public from local discovery", () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Public needs are readable by anyone"');
    expect(migration).toContain("visibility = 'public'");
    expect(migration).toContain(
      'CREATE POLICY "Verified locality members can read local discovery needs"',
    );
    expect(migration).toContain("TO authenticated");
    expect(migration).toContain("visibility = 'local_discovery'");
    expect(migration).toContain("private.is_verified_locality_member(place_id)");
  });

  it("derives authorization from verified private memberships, never an editable profile locality", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS private.locality_memberships");
    expect(migration).toContain("membership.status = 'verified'");
    expect(migration).toContain("membership.user_id = auth.uid()");
    expect(migration).toContain("WITH RECURSIVE place_chain");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = ''");
    expect(migration).not.toContain("FROM public.profiles");
  });

  it("does not grant client roles direct access to membership evidence or the helper", () => {
    expect(migration).toContain(
      "REVOKE ALL ON TABLE private.locality_memberships FROM PUBLIC, anon, authenticated",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION private.is_verified_locality_member(uuid) FROM PUBLIC, anon",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION private.is_verified_locality_member(uuid) TO authenticated",
    );
  });

  it("covers anonymous, two-locality, child-locality, and profile-spoof cases in disposable SQL", () => {
    expect(sqlTest).toContain("SELECT plan(11)");
    for (const label of [
      "anon_all_local",
      "user_a_all_local",
      "user_a_cross_locality_b",
      "user_a_after_profile_spoof",
      "user_b_all_local",
      "user_b_cross_locality_a",
      "village_member_all_local",
      "village_member_parent_place",
    ]) {
      expect(sqlTest).toContain(label);
    }
    expect(sqlTest).toContain("SELECT * FROM finish()");
    expect(sqlTest).toContain("ROLLBACK");
  });

  it("keeps the existing anonymous open-needs server reader subject to the database policy", () => {
    const start = needReaders.indexOf("export const getOpenNeeds =");
    const end = needReaders.indexOf("/**", start + 1);
    expect(start).toBeGreaterThanOrEqual(0);
    const reader = needReaders.slice(start, end > start ? end : start + 1700);
    expect(reader).toContain('import("./supabase-public.server")');
    expect(reader).toContain('.from("needs")');
    expect(reader).toContain('.in("visibility", ["public", "local_discovery"])');
    // The anonymous client can still ask for these rows, but RLS now returns
    // only public rows. A verified-member UX must use an authenticated read path.
    expect(migration).toContain(
      'CREATE POLICY "Verified locality members can read local discovery needs"',
    );
  });
});
