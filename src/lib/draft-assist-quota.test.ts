import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { draftQuotaRetryMessage, parseDraftQuotaResponse } from "./draft-assist-quota";

const migration = readFileSync(
  new URL("../../supabase/migrations/20261022121000_ai_draft_atomic_quota.sql", import.meta.url),
  "utf8",
);
const searchPathHardeningMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20261023030000_harden_ai_draft_quota_search_path.sql",
    import.meta.url,
  ),
  "utf8",
);
const serverFunction = readFileSync(
  new URL("./draft-assist.functions.ts", import.meta.url),
  "utf8",
);

describe("draft-assist quota response boundary", () => {
  it("accepts only one well-formed allow row", () => {
    expect(
      parseDraftQuotaResponse([{ allowed: true, retry_after_seconds: 0, limit_kind: "allowed" }]),
    ).toEqual({ allowed: true });
  });

  it("turns a denied quota into a bounded retry decision", () => {
    expect(
      parseDraftQuotaResponse([{ allowed: false, retry_after_seconds: 125, limit_kind: "hourly" }]),
    ).toEqual({ allowed: false, limitKind: "hourly", retryAfterSeconds: 125 });
    expect(draftQuotaRetryMessage(125)).toContain("about 3 minutes");
  });

  it("fails closed for missing, multiple, or malformed database rows", () => {
    for (const result of [
      null,
      undefined,
      [],
      [{ allowed: true, retry_after_seconds: 0, limit_kind: "daily" }],
      [{ allowed: "true", retry_after_seconds: 0, limit_kind: "allowed" }],
      [{ allowed: true, retry_after_seconds: 1, limit_kind: "allowed" }],
      [{ allowed: false, retry_after_seconds: 0, limit_kind: "hourly" }],
      [{ allowed: false, retry_after_seconds: 5, limit_kind: "other" }],
      [
        { allowed: true, retry_after_seconds: 0, limit_kind: "allowed" },
        { allowed: true, retry_after_seconds: 0, limit_kind: "allowed" },
      ],
    ]) {
      expect(parseDraftQuotaResponse(result)).toBeNull();
    }
  });

  it("treats an authentication-shaped quota denial as unavailable", () => {
    expect(
      parseDraftQuotaResponse([
        { allowed: false, retry_after_seconds: 0, limit_kind: "unauthenticated" },
      ]),
    ).toEqual({ allowed: false, limitKind: "unavailable" });
  });
});

describe("AI draft quota database security contract", () => {
  it("has an executable SQL integration test for real quota decisions", () => {
    const sqlTest = readFileSync(
      new URL("../../supabase/tests/ai_draft_quota_security.test.sql", import.meta.url),
      "utf8",
    );
    expect(sqlTest).toContain("public.consume_ai_draft_quota()");
    expect(sqlTest).toContain("attempts six through twenty are denied by the hourly limit");
    expect(sqlTest).toContain("the twenty-first attempt is denied by the daily limit");
    expect(sqlTest).toContain("independent quota row");
  });

  it("binds the limit to auth.uid and serializes concurrent callers per account", () => {
    expect(migration).toContain("v_user_id := auth.uid();");
    expect(migration).toContain(
      "user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE",
    );
    expect(migration).toContain("ON CONFLICT (user_id) DO NOTHING");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("UPDATE public.ai_draft_rate_limits");
    expect(migration).toContain("v_hour_count := CASE");
    expect(migration).toContain("v_day_count := CASE");
    expect(migration).toContain("5 per UTC hour and 20 per UTC day");
    expect(migration).toContain("date_trunc('hour', v_now AT TIME ZONE 'UTC')");
    expect(migration).toContain("date_trunc('day', v_now AT TIME ZONE 'UTC')");
    expect(migration).not.toMatch(
      /CREATE OR REPLACE FUNCTION public\.consume_ai_draft_quota\([^)]*user_id/i,
    );
  });

  it("keeps the quota ledger private and constrains the definer function", () => {
    expect(migration).toContain(
      "ALTER TABLE public.ai_draft_rate_limits ENABLE ROW LEVEL SECURITY;",
    );
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.ai_draft_rate_limits FROM PUBLIC, anon, authenticated, service_role;",
    );
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = pg_catalog, public");
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.consume_ai_draft_quota() FROM PUBLIC, anon, service_role;",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.consume_ai_draft_quota() TO authenticated;",
    );
    expect(migration).not.toMatch(/^\s*(?:prompt|prompt_text|completion_text)\s+\w+/im);
  });

  it("removes the public schema from the effective quota-function search path", () => {
    expect(searchPathHardeningMigration).toMatch(
      /ALTER FUNCTION public\.consume_ai_draft_quota\(\)\s+SET search_path = pg_catalog;/,
    );
  });

  it("checks the emergency stop and quota before the paid provider path", () => {
    const stop = serverFunction.indexOf("isDraftAssistDisabled(process.env");
    const quota = serverFunction.indexOf('quotaClient.rpc("consume_ai_draft_quota")');
    const provider = serverFunction.indexOf('await import("./draft-assist.server")');
    expect(stop).toBeGreaterThanOrEqual(0);
    expect(quota).toBeGreaterThan(stop);
    expect(provider).toBeGreaterThan(quota);
    expect(serverFunction).toContain('code: "RATE_LIMITED"');
    expect(serverFunction).toContain("setResponseStatus(429)");
    expect(serverFunction).toContain(
      'setResponseHeader("Retry-After", String(quota.retryAfterSeconds))',
    );
    expect(serverFunction).toContain('setResponseHeader("Cache-Control", "no-store")');
    expect(serverFunction.indexOf("setResponseStatus(429)")).toBeLessThan(
      serverFunction.indexOf('code: "RATE_LIMITED"'),
    );
    expect(serverFunction).toContain('code: "UNAVAILABLE"');
  });
});
