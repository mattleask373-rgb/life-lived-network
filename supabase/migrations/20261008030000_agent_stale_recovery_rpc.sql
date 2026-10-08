-- Phase 3 recovery: atomically fence expired work and preserve attempt evidence.
CREATE OR REPLACE FUNCTION public.mark_stale_agent_tasks(
  heartbeat_grace_minutes INTEGER DEFAULT 45
)
RETURNS SETOF public.agent_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.agent_tasks;
BEGIN
  IF heartbeat_grace_minutes < 0 OR heartbeat_grace_minutes > 1440 THEN
    RAISE EXCEPTION 'heartbeat_grace_minutes must be between 0 and 1440';
  END IF;

  FOR row IN
    SELECT t.*
    FROM public.agent_tasks t
    WHERE t.status IN ('CLAIMED','IN_PROGRESS','VERIFYING')
      AND t.lease_expiry IS NOT NULL
      AND t.lease_expiry <= now()
      AND t.last_heartbeat IS NOT NULL
      AND t.last_heartbeat < now() - make_interval(mins => heartbeat_grace_minutes)
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.agent_tasks
    SET status = 'STALE',
        owner = NULL,
        lease_token = NULL,
        lease_start = NULL,
        lease_expiry = NULL,
        last_heartbeat = NULL,
        updated_at = now()
    WHERE task_id = row.task_id
      AND status IN ('CLAIMED','IN_PROGRESS','VERIFYING');

    UPDATE public.agent_execution_attempts
    SET status = 'STALE',
        finished_at = COALESCE(finished_at, now()),
        evidence = evidence || jsonb_build_array(jsonb_build_object(
          'kind', 'lease_recovery',
          'reason', 'lease expired and heartbeat grace exceeded',
          'lease_generation', row.lease_generation,
          'recovered_at', now()
        ))
    WHERE task_id = row.task_id
      AND status IN ('DISPATCHED','RUNNING','VERIFYING');

    INSERT INTO public.agent_execution_audit (
      run_id, attempt_id, actor_id, workspace_id, task_id,
      action, result, evidence
    )
    SELECT
      a.run_id, a.attempt_id, 'system:lease-recovery', row.workspace_id, row.task_id,
      'MARK_STALE', 'STALE',
      jsonb_build_object(
        'lease_generation', row.lease_generation,
        'reason', 'lease expired and heartbeat grace exceeded'
      )
    FROM public.agent_execution_attempts a
    WHERE a.task_id = row.task_id
      AND a.status = 'STALE'
    ORDER BY a.finished_at DESC NULLS LAST
    LIMIT 1;

    SELECT * INTO row FROM public.agent_tasks WHERE task_id = row.task_id;
    RETURN NEXT row;
  END LOOP;
END;
$$;

ALTER FUNCTION public.mark_stale_agent_tasks(INTEGER) RESTRICT;
REVOKE ALL ON FUNCTION public.mark_stale_agent_tasks(INTEGER) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.mark_stale_agent_tasks(INTEGER) TO service_role;
  END IF;
END $$;
