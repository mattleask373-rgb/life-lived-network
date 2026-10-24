import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = (name: string) =>
  readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");

describe("agent control-plane migration lineage (static contract)", () => {
  it("contains the ordered table, lease, state, fencing, identity, dispatch and recovery chain", () => {
    const names = [
      "20261007120000_agent_orchestration.sql",
      "20261007133000_agent_claim_leases.sql",
      "20261007140000_agent_claim_lease_hardening.sql",
      "20261007150000_agent_status_transitions.sql",
      "20261007151000_agent_transition_lease_renew.sql",
      "20261007160000_agent_security_grants_and_cancelled.sql",
      "20261007170000_agent_lease_fencing.sql",
      "20261007171000_remove_unfenced_heartbeat.sql",
      "20261007172000_fence_release.sql",
      "20261008010000_agent_execution_identity.sql",
      "20261008020000_agent_dispatch_boundary.sql",
      "20261008023000_agent_task_lifecycle_reconciliation.sql",
      "20261008030000_agent_stale_recovery_rpc.sql",
      "20261008100000_agent_control_plane_hosted_proof.sql",
      "20261022190000_harden_agent_control_plane_overloads.sql",
      "20261023130000_agent_dispatch_idempotency_scope.sql",
    ];
    expect(names).toEqual([...names].sort());
    for (const name of names) expect(migration(name).length).toBeGreaterThan(100);
  });

  it("creates tables before lease/fencing and execution tables before dispatch/recovery", () => {
    expect(migration("20261007120000_agent_orchestration.sql")).toContain(
      "CREATE TABLE IF NOT EXISTS public.agent_tasks",
    );
    expect(migration("20261007133000_agent_claim_leases.sql")).toContain(
      "CREATE OR REPLACE FUNCTION public.claim_agent_task",
    );
    expect(migration("20261007170000_agent_lease_fencing.sql")).toContain(
      "ADD COLUMN IF NOT EXISTS lease_generation",
    );
    expect(migration("20261008010000_agent_execution_identity.sql")).toContain(
      "CREATE TABLE IF NOT EXISTS public.agent_execution_attempts",
    );
    expect(migration("20261008020000_agent_dispatch_boundary.sql")).toContain(
      "CREATE OR REPLACE FUNCTION public.dispatch_agent_attempt",
    );
    expect(migration("20261008030000_agent_stale_recovery_rpc.sql")).toContain(
      "CREATE OR REPLACE FUNCTION public.mark_stale_agent_tasks",
    );
    const idempotency = migration("20261023130000_agent_dispatch_idempotency_scope.sql");
    expect(idempotency).toContain("ALTER COLUMN attempt_id SET DEFAULT gen_random_uuid()");
    expect(idempotency).toContain("correlation ID already bound to a different dispatch scope");
    expect(idempotency).toContain(
      "task_row.lease_generation IS DISTINCT FROM attempt_row.lease_generation",
    );
    expect(idempotency).toContain("NULL::TEXT");
    expect(idempotency).toContain("'REPLAYED'::TEXT");
    const replayBlock =
      idempotency.split("IF FOUND THEN")[1]?.split("IF task_row.status <> 'READY'")[0] ?? "";
    expect(replayBlock).toContain("attempt_row.lease_generation, NULL::TEXT");
    expect(replayBlock).toContain("'REPLAYED'::TEXT");
    expect(replayBlock).not.toContain("attempt_row.lease_generation, attempt_row.lease_token,");

    const dispatchTest = readFileSync(
      new URL("../../supabase/tests/agent_dispatch_idempotency.test.sql", import.meta.url),
      "utf8",
    );
    expect(dispatchTest).toContain("'REPLAYED'");
    expect(dispatchTest).toContain("lease_token IS NULL");
    expect(dispatchTest).toContain("existing dispatch lease is no longer active");
  });

  it("keeps client table access denied and execution RPCs service-role only", () => {
    const initial = migration("20261007120000_agent_orchestration.sql");
    const grant = migration("20261007160000_agent_security_grants_and_cancelled.sql");
    const execution = migration("20261008010000_agent_execution_identity.sql");
    const dispatch = migration("20261008020000_agent_dispatch_boundary.sql");
    const final = migration("20261022190000_harden_agent_control_plane_overloads.sql");
    expect(initial).toContain("agent_tasks_no_client_access");
    expect(grant).toContain("GRANT EXECUTE ON FUNCTION public.claim_agent_task");
    expect(execution).toContain("agent_execution_attempts_no_client_access");
    expect(dispatch).toContain("GRANT EXECUTE ON FUNCTION public.dispatch_agent_attempt");
    expect(final).toContain("FROM anon");
    expect(final).toContain("FROM authenticated");
    expect(final).toContain("TO service_role");
  });

  it("removes both unfenced heartbeat overloads and hardens definer search paths", () => {
    expect(migration("20261007171000_remove_unfenced_heartbeat.sql")).toContain(
      "DROP FUNCTION IF EXISTS public.heartbeat_agent_task(TEXT, TEXT)",
    );
    const final = migration("20261022190000_harden_agent_control_plane_overloads.sql");
    expect(final).toContain(
      "DROP FUNCTION IF EXISTS public.heartbeat_agent_task(TEXT, TEXT, INTEGER)",
    );
    expect(final).toContain(
      "ALTER FUNCTION public.release_agent_task(TEXT, TEXT, TEXT, BIGINT, TEXT)",
    );
    expect(final).toContain("SET search_path = pg_catalog, public");
  });

  it("does not put unsupported RESTRICT clauses after ALTER FUNCTION statements", () => {
    const names = [
      "20261007133000_agent_claim_leases.sql",
      "20261007140000_agent_claim_lease_hardening.sql",
      "20261007150000_agent_status_transitions.sql",
      "20261007151000_agent_transition_lease_renew.sql",
      "20261007160000_agent_security_grants_and_cancelled.sql",
      "20261007170000_agent_lease_fencing.sql",
      "20261007172000_fence_release.sql",
      "20261008020000_agent_dispatch_boundary.sql",
      "20261008030000_agent_stale_recovery_rpc.sql",
    ];
    for (const name of names) {
      expect(migration(name)).not.toMatch(/ALTER FUNCTION[^;]*\bRESTRICT\s*;/i);
    }
  });

  it("does not fail with a regclass-cast exception if hosted proof tables are absent", () => {
    const proof = migration("20261008100000_agent_control_plane_hosted_proof.sql");
    expect(proof).toContain("to_regclass('public.agent_tasks')");
    expect(proof).not.toContain("'public.agent_tasks'::regclass");
  });
});
