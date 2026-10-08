-- Phase 12: fence dispatch correlation idempotency by execution identity.
-- A correlation id is not a global bearer capability. Replays are returned
-- only when run/actor/scope/task/provider all match the original attempt.
-- Conflicting correlation reuse is rejected.

CREATE OR REPLACE FUNCTION public.dispatch_agent_attempt(
  requested_task_id TEXT,
  requested_run_id UUID,
  requested_actor_id TEXT,
  requested_workspace_id TEXT,
  requested_project_id TEXT,
  requested_provider_id TEXT,
  requested_correlation_id TEXT
)
RETURNS TABLE (
  attempt_id UUID,
  task_id TEXT,
  run_id UUID,
  workspace_id TEXT,
  project_id TEXT,
  lease_generation BIGINT,
  lease_token TEXT,
  status TEXT,
  correlation_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_row public.agent_tasks;
  run_row public.agent_execution_runs;
  attempt_row public.agent_execution_attempts;
BEGIN
  IF NULLIF(btrim(requested_task_id), '') IS NULL
     OR requested_run_id IS NULL
     OR NULLIF(btrim(requested_actor_id), '') IS NULL
     OR NULLIF(btrim(requested_workspace_id), '') IS NULL
     OR NULLIF(btrim(requested_project_id), '') IS NULL
     OR NULLIF(btrim(requested_provider_id), '') IS NULL
     OR NULLIF(btrim(requested_correlation_id), '') IS NULL THEN
    RAISE EXCEPTION 'dispatch identity and scope are required';
  END IF;

  SELECT * INTO run_row
  FROM public.agent_execution_runs
  WHERE run_id = requested_run_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'execution run not found';
  END IF;

  IF run_row.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'execution run is not active';
  END IF;

  IF run_row.actor_id <> requested_actor_id
     OR run_row.workspace_id <> requested_workspace_id
     OR COALESCE(run_row.project_id, '') <> requested_project_id THEN
    RAISE EXCEPTION 'execution identity or scope mismatch';
  END IF;

  -- Idempotency is valid only for the exact execution identity and scope.
  -- Do this before requiring READY so a legitimate replay after claim returns
  -- the original attempt rather than being mistaken for a second dispatch.
  SELECT * INTO attempt_row
  FROM public.agent_execution_attempts
  WHERE correlation_id = requested_correlation_id
  FOR UPDATE;

  IF FOUND THEN
    IF attempt_row.task_id <> requested_task_id
       OR attempt_row.run_id <> requested_run_id
       OR attempt_row.workspace_id <> requested_workspace_id
       OR COALESCE(attempt_row.project_id, '') <> requested_project_id
       OR attempt_row.provider_id <> requested_provider_id THEN
      RAISE EXCEPTION 'correlation id already belongs to a different execution scope';
    END IF;

    RETURN QUERY SELECT
      attempt_row.attempt_id, attempt_row.task_id, attempt_row.run_id,
      attempt_row.workspace_id, attempt_row.project_id,
      attempt_row.lease_generation, attempt_row.lease_token,
      attempt_row.status, attempt_row.correlation_id;
    RETURN;
  END IF;

  SELECT * INTO task_row
  FROM public.agent_tasks
  WHERE task_id = requested_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'task not found';
  END IF;

  IF task_row.status <> 'READY' THEN
    RAISE EXCEPTION 'task is not READY';
  END IF;

  IF task_row.workspace_id <> requested_workspace_id
     OR COALESCE(task_row.project_id, '') <> requested_project_id THEN
    RAISE EXCEPTION 'task scope mismatch';
  END IF;

  IF task_row.autonomy NOT IN ('L0','L1','L2') THEN
    RAISE EXCEPTION 'autonomy level requires a higher authorization gate';
  END IF;

  IF task_row.risk IN ('P0','P1') THEN
    RAISE EXCEPTION 'human-gated risk cannot be dispatched automatically';
  END IF;

  task_row.lease_generation := task_row.lease_generation + 1;
  task_row.lease_token := gen_random_uuid()::text;

  UPDATE public.agent_tasks
  SET owner = requested_actor_id,
      lease_generation = task_row.lease_generation,
      lease_token = task_row.lease_token,
      status = 'CLAIMED',
      lease_start = now(),
      lease_expiry = now() + interval '15 minutes',
      last_heartbeat = now(),
      updated_at = now()
  WHERE task_id = requested_task_id
    AND status = 'READY';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'task changed during dispatch';
  END IF;

  INSERT INTO public.agent_execution_attempts (
    run_id, task_id, workspace_id, project_id,
    lease_generation, lease_token, correlation_id,
    status, provider_id
  )
  VALUES (
    requested_run_id, requested_task_id, requested_workspace_id, requested_project_id,
    task_row.lease_generation, task_row.lease_token, requested_correlation_id,
    'DISPATCHED', requested_provider_id
  )
  RETURNING * INTO attempt_row;

  INSERT INTO public.agent_execution_audit (
    run_id, attempt_id, actor_id, workspace_id, task_id,
    action, result, evidence
  )
  VALUES (
    requested_run_id, attempt_row.attempt_id, requested_actor_id,
    requested_workspace_id, requested_task_id,
    'DISPATCH', 'DISPATCHED',
    jsonb_build_object(
      'project_id', requested_project_id,
      'provider_id', requested_provider_id,
      'correlation_id', requested_correlation_id,
      'lease_generation', task_row.lease_generation
    )
  );

  RETURN QUERY SELECT
    attempt_row.attempt_id, attempt_row.task_id, attempt_row.run_id,
    attempt_row.workspace_id, attempt_row.project_id,
    attempt_row.lease_generation, attempt_row.lease_token,
    attempt_row.status, attempt_row.correlation_id;
END;
$$;

ALTER FUNCTION public.dispatch_agent_attempt(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) RESTRICT;
REVOKE ALL ON FUNCTION public.dispatch_agent_attempt(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.dispatch_agent_attempt(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
  END IF;
END $$;
