-- Make dispatch retries fail closed and idempotent.
-- Repeated correlation IDs return a metadata-only REPLAYED marker; they never
-- return the existing lease token and never authorize a second provider call.
-- The runtime must continue to accept only a newly created DISPATCHED lease.

ALTER TABLE public.agent_execution_attempts
  ALTER COLUMN attempt_id SET DEFAULT gen_random_uuid();

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
SET search_path = pg_catalog, public
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
  FROM public.agent_execution_runs AS execution_run
  WHERE execution_run.run_id = requested_run_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'execution run not found';
  END IF;

  IF run_row.actor_id <> requested_actor_id
     OR run_row.workspace_id <> requested_workspace_id
     OR COALESCE(run_row.project_id, '') <> requested_project_id THEN
    RAISE EXCEPTION 'execution identity or scope mismatch';
  END IF;

  -- Idempotency must be checked before READY validation because the original
  -- successful dispatch has already transitioned the task to CLAIMED. Validate
  -- every immutable dimension before returning a replay marker.
  SELECT * INTO attempt_row
  FROM public.agent_execution_attempts AS existing_attempt
  WHERE existing_attempt.correlation_id = requested_correlation_id
  FOR UPDATE;

  IF FOUND THEN
    IF attempt_row.task_id <> requested_task_id
       OR attempt_row.run_id <> requested_run_id
       OR attempt_row.workspace_id <> requested_workspace_id
       OR COALESCE(attempt_row.project_id, '') <> requested_project_id
       OR attempt_row.provider_id <> requested_provider_id
       OR attempt_row.correlation_id <> requested_correlation_id THEN
      RAISE EXCEPTION 'correlation ID reuse mismatch';
    END IF;

    -- Never re-emit an existing lease token. REPLAYED is intentionally not an
    -- agent_execution_attempts status and is rejected by the worker core.
    RETURN QUERY SELECT
      attempt_row.attempt_id,
      attempt_row.task_id,
      attempt_row.run_id,
      attempt_row.workspace_id,
      attempt_row.project_id,
      attempt_row.lease_generation,
      NULL::TEXT,
      'REPLAYED'::TEXT,
      attempt_row.correlation_id;
    RETURN;
  END IF;

  IF run_row.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'execution run is not active';
  END IF;

  SELECT * INTO task_row
  FROM public.agent_tasks AS task
  WHERE task.task_id = requested_task_id
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

  UPDATE public.agent_tasks AS task
  SET owner = requested_actor_id,
      lease_generation = task_row.lease_generation,
      lease_token = task_row.lease_token,
      status = 'CLAIMED',
      lease_start = now(),
      lease_expiry = now() + interval '15 minutes',
      last_heartbeat = now(),
      updated_at = now()
  WHERE task.task_id = requested_task_id
    AND task.status = 'READY';

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

REVOKE ALL ON FUNCTION public.dispatch_agent_attempt(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION public.dispatch_agent_attempt(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON FUNCTION public.dispatch_agent_attempt(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.dispatch_agent_attempt(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
  END IF;
END $$;
