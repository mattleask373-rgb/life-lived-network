-- Repair legacy overloads and harden the final control-plane trust boundary.
-- This migration is source evidence only until remote history/project identity is confirmed.

-- The 2-argument overload is retired in 17:10; the unfenced 3-argument overload
-- was also introduced by the earlier lease hardening migration. Remove both.
DROP FUNCTION IF EXISTS public.heartbeat_agent_task(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.heartbeat_agent_task(TEXT, TEXT, INTEGER);

-- SECURITY DEFINER functions use a deterministic trusted search path.
ALTER FUNCTION public.claim_agent_task(TEXT, TEXT, INTEGER)
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.heartbeat_agent_task(TEXT, TEXT, INTEGER, BIGINT, TEXT)
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.release_agent_task(TEXT, TEXT, TEXT, BIGINT, TEXT)
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.mark_stale_agent_tasks(INTEGER)
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.reclaim_agent_task(TEXT, TEXT, INTEGER)
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT, BIGINT, TEXT)
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.dispatch_agent_attempt(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
  SET search_path = pg_catalog, public;
ALTER FUNCTION public.verify_agent_control_plane_security()
  SET search_path = pg_catalog, public;

-- Client roles must have no direct table access. The service role is the only
-- intended storage actor; RLS deny policies remain an independent safeguard.
REVOKE ALL ON TABLE public.agent_events, public.agent_tasks,
  public.agent_task_completions, public.agent_execution_runs,
  public.agent_execution_attempts, public.agent_execution_audit FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.agent_events, public.agent_tasks,
      public.agent_task_completions, public.agent_execution_runs,
      public.agent_execution_attempts, public.agent_execution_audit FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.agent_events, public.agent_tasks,
      public.agent_task_completions, public.agent_execution_runs,
      public.agent_execution_attempts, public.agent_execution_audit FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON TABLE public.agent_events, public.agent_tasks,
      public.agent_task_completions, public.agent_execution_runs,
      public.agent_execution_attempts, public.agent_execution_audit TO service_role;

    GRANT EXECUTE ON FUNCTION public.claim_agent_task(TEXT, TEXT, INTEGER) TO service_role;
    GRANT EXECUTE ON FUNCTION public.heartbeat_agent_task(TEXT, TEXT, INTEGER, BIGINT, TEXT) TO service_role;
    GRANT EXECUTE ON FUNCTION public.release_agent_task(TEXT, TEXT, TEXT, BIGINT, TEXT) TO service_role;
    GRANT EXECUTE ON FUNCTION public.mark_stale_agent_tasks(INTEGER) TO service_role;
    GRANT EXECUTE ON FUNCTION public.reclaim_agent_task(TEXT, TEXT, INTEGER) TO service_role;
    GRANT EXECUTE ON FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT, BIGINT, TEXT) TO service_role;
    GRANT EXECUTE ON FUNCTION public.dispatch_agent_attempt(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
    GRANT EXECUTE ON FUNCTION public.verify_agent_control_plane_security() TO service_role;
  END IF;
END
$$;

-- Explicitly deny every final RPC to client roles even if an earlier migration
-- or environment default granted a direct execute privilege.
REVOKE ALL ON FUNCTION public.claim_agent_task(TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.heartbeat_agent_task(TEXT, TEXT, INTEGER, BIGINT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_agent_task(TEXT, TEXT, TEXT, BIGINT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_stale_agent_tasks(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reclaim_agent_task(TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT, BIGINT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dispatch_agent_attempt(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_agent_control_plane_security() FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION public.claim_agent_task(TEXT, TEXT, INTEGER) FROM anon;
    REVOKE ALL ON FUNCTION public.heartbeat_agent_task(TEXT, TEXT, INTEGER, BIGINT, TEXT) FROM anon;
    REVOKE ALL ON FUNCTION public.release_agent_task(TEXT, TEXT, TEXT, BIGINT, TEXT) FROM anon;
    REVOKE ALL ON FUNCTION public.mark_stale_agent_tasks(INTEGER) FROM anon;
    REVOKE ALL ON FUNCTION public.reclaim_agent_task(TEXT, TEXT, INTEGER) FROM anon;
    REVOKE ALL ON FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT, BIGINT, TEXT) FROM anon;
    REVOKE ALL ON FUNCTION public.dispatch_agent_attempt(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
    REVOKE ALL ON FUNCTION public.verify_agent_control_plane_security() FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON FUNCTION public.claim_agent_task(TEXT, TEXT, INTEGER) FROM authenticated;
    REVOKE ALL ON FUNCTION public.heartbeat_agent_task(TEXT, TEXT, INTEGER, BIGINT, TEXT) FROM authenticated;
    REVOKE ALL ON FUNCTION public.release_agent_task(TEXT, TEXT, TEXT, BIGINT, TEXT) FROM authenticated;
    REVOKE ALL ON FUNCTION public.mark_stale_agent_tasks(INTEGER) FROM authenticated;
    REVOKE ALL ON FUNCTION public.reclaim_agent_task(TEXT, TEXT, INTEGER) FROM authenticated;
    REVOKE ALL ON FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT, BIGINT, TEXT) FROM authenticated;
    REVOKE ALL ON FUNCTION public.dispatch_agent_attempt(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
    REVOKE ALL ON FUNCTION public.verify_agent_control_plane_security() FROM authenticated;
  END IF;
END
$$;
