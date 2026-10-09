-- Phase 14 hosted-proof helper.
-- Read-only verification surface; it does not mutate control-plane state.
-- Human-gated: deployment is required before any hosted result can be claimed.

CREATE OR REPLACE FUNCTION public.verify_agent_control_plane_security()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  tables_ok BOOLEAN;
  rls_ok BOOLEAN;
  policies_ok BOOLEAN;
  client_rpc_blocked BOOLEAN;
  service_rpc_available BOOLEAN;
BEGIN
  tables_ok :=
    to_regclass('public.agent_events') IS NOT NULL
    AND to_regclass('public.agent_tasks') IS NOT NULL
    AND to_regclass('public.agent_execution_runs') IS NOT NULL
    AND to_regclass('public.agent_execution_attempts') IS NOT NULL
    AND to_regclass('public.agent_execution_audit') IS NOT NULL;

  rls_ok := COALESCE((
    SELECT bool_and(c.relrowsecurity)
    FROM pg_class c
    WHERE c.oid IN (
      'public.agent_events'::regclass,
      'public.agent_tasks'::regclass,
      'public.agent_execution_runs'::regclass,
      'public.agent_execution_attempts'::regclass,
      'public.agent_execution_audit'::regclass
    )
  ), false);

  policies_ok :=
    EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_events'
      AND policyname = 'agent_events_no_client_access')
    AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_tasks'
      AND policyname = 'agent_tasks_no_client_access')
    AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_execution_runs'
      AND policyname = 'agent_execution_runs_no_client_access')
    AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_execution_attempts'
      AND policyname = 'agent_execution_attempts_no_client_access')
    AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'agent_execution_audit'
      AND policyname = 'agent_execution_audit_no_client_access');

  client_rpc_blocked :=
    CASE
      WHEN to_regprocedure('public.claim_agent_task(text,text,integer)') IS NULL THEN false
      ELSE NOT has_function_privilege('anon', 'public.claim_agent_task(text,text,integer)', 'EXECUTE')
        AND NOT has_function_privilege('authenticated', 'public.claim_agent_task(text,text,integer)', 'EXECUTE')
    END;

  service_rpc_available :=
    CASE
      WHEN to_regprocedure('public.claim_agent_task(text,text,integer)') IS NULL THEN false
      ELSE has_function_privilege('service_role', 'public.claim_agent_task(text,text,integer)', 'EXECUTE')
    END;

  RETURN jsonb_build_object(
    'tables_present', tables_ok,
    'rls_enabled', rls_ok,
    'client_deny_policies_present', policies_ok,
    'client_claim_rpc_blocked', client_rpc_blocked,
    'service_role_claim_rpc_available', service_rpc_available,
    'proof_complete', tables_ok AND rls_ok AND policies_ok
      AND client_rpc_blocked AND service_rpc_available
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_agent_control_plane_security() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.verify_agent_control_plane_security() TO service_role;
  END IF;
END $$;
