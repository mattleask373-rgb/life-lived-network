import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { reviewLocalityMembershipInput } from "./locality-membership-admin";

const handlerSource = readFileSync(
  new URL("./locality-membership-admin.functions.ts", import.meta.url),
  "utf8",
);
const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20261023213000_locality_membership_admin.sql",
    import.meta.url,
  ),
  "utf8",
);
const sqlTest = readFileSync(
  new URL("../../supabase/tests/locality_membership_admin.test.sql", import.meta.url),
  "utf8",
);

const base = {
  userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  placeId: "10000000-0000-4000-8000-000000000001",
};

describe("governed locality membership provisioning contract", () => {
  it("accepts a grant only with a review reason, verification method and opaque evidence reference", () => {
    expect(
      reviewLocalityMembershipInput.safeParse({
        ...base,
        action: "grant",
        reasonCode: "locality_relationship_verified",
        verificationMethod: "local_steward",
        evidenceReference: "case:steward-2026-001",
      }).success,
    ).toBe(true);
    expect(
      reviewLocalityMembershipInput.safeParse({
        ...base,
        action: "grant",
        reasonCode: "locality_relationship_verified",
        verificationMethod: "local_steward",
        evidenceReference: "person@example.com",
      }).success,
    ).toBe(false);
    expect(
      reviewLocalityMembershipInput.safeParse({
        ...base,
        action: "grant",
        reasonCode: "locality_relationship_verified",
        verificationMethod: "local_steward",
        evidenceReference: "",
      }).success,
    ).toBe(false);
  });

  it("accepts only controlled revocation reasons and rejects extra user-supplied fields", () => {
    expect(
      reviewLocalityMembershipInput.safeParse({
        ...base,
        action: "revoke",
        reasonCode: "member_request",
      }).success,
    ).toBe(true);
    expect(
      reviewLocalityMembershipInput.safeParse({
        ...base,
        action: "revoke",
        reasonCode: "free-text-reason",
      }).success,
    ).toBe(false);
    expect(
      reviewLocalityMembershipInput.safeParse({
        ...base,
        action: "revoke",
        reasonCode: "member_request",
        actorId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      }).success,
    ).toBe(false);
  });

  it("checks the request-bound admin role before using the service-role client", () => {
    const roleCheck = handlerSource.indexOf('.eq("role", "admin")');
    const serviceClient = handlerSource.indexOf(
      'await import("@/integrations/supabase/client.server")',
    );
    expect(roleCheck).toBeGreaterThanOrEqual(0);
    expect(serviceClient).toBeGreaterThan(roleCheck);
    expect(handlerSource).toContain(".middleware([requireSupabaseAuth])");
    expect(handlerSource).toContain("context.userId");
    expect(handlerSource).toContain('rpc.rpc("review_locality_membership"');
  });

  it("keeps the audit table and privileged RPC closed to client roles", () => {
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.review_locality_membership");
    expect(migration).toContain("TO service_role");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE private.locality_membership_events FROM PUBLIC, anon, authenticated, service_role",
    );
    expect(sqlTest).toContain("SELECT plan(15)");
    expect(sqlTest).toContain("actor must be a current administrator");
    expect(sqlTest).toContain("no current verified locality membership found");
  });
});
