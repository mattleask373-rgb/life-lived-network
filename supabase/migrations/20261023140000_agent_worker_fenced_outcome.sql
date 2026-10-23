-- Atomically persist a bounded worker outcome under the same durable lease fence.
-- This is source-only until reviewed and applied in an explicitly isolated non-production
-- project. No outcome can accept, integrate, merge, or deploy work.
CREATE OR REPLACE FUNCTION public.record_agent_attempt_outcome(
  requested_attempt_id UUID,
  requested_task_id TEXT,
  requested_actor_id TEXT,
  requested_lease_generation BIGINT,
  requested_lease_token TEXT,
  requested_outcome TEXT,
  requested_evidence JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_run_id UUID;
  run_row public.agent_execution_runs;
  task_row public.agent_tasks;
  attempt_row public.agent_execution_attempts;
  v_event JSONB;
  v_task_status TEXT;
  v_attempt_status TEXT;
  v_run_status TEXT;
  v_release_lease BOOLEAN;
BEGIN
  IF requested_attempt_id IS NULL
     OR NULLIF(btrim(requested_task_id), '') IS NULL
     OR NULLIF(btrim(requested_actor_id), '') IS NULL
     OR requested_lease_generation IS NULL
     OR requested_lease_generation < 1
     OR NULLIF(btrim(requested_lease_token), '') IS NULL
     OR NULLIF(btrim(requested_outcome), '') IS NULL
     OR requested_evidence IS NULL
     OR jsonb_typeof(requested_evidence) <> 'object'
     OR pg_column_size(requested_evidence) > 131072 THEN
    RAISE EXCEPTION 'worker outcome payload or lease identity is invalid';
  END IF;

  IF requested_outcome NOT IN (
    'VERIFYING',
    'BLOCKED',
    'FAILED',
    'PARTIAL',
    'EXECUTION_TIMEOUT',
    'PROVIDER_FAILED',
    'PROVIDER_RESULT_INVALID'
  ) THEN
    RAISE EXCEPTION 'worker outcome is not permitted';
  END IF;

  -- Lock in the same run -> task -> attempt order as atomic dispatch. This
  -- reduces deadlock risk if a retry races with outcome persistence.
  SELECT existing_attempt.run_id
    INTO v_run_id
  FROM public.agent_execution_attempts AS existing_attempt
  WHERE existing_attempt.attempt_id = requested_attempt_id
    AND existing_attempt.task_id = requested_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'execution attempt not found';
  END IF;

  SELECT * INTO run_row
  FROM public.agent_execution_runs AS execution_run
  WHERE execution_run.run_id = v_run_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'execution run not found';
  END IF;

  SELECT * INTO task_row
  FROM public.agent_tasks AS task
  WHERE task.task_id = requested_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'task not found';
  END IF;

  SELECT * INTO attempt_row
  FROM public.agent_execution_attempts AS existing_attempt
  WHERE existing_attempt.attempt_id = requested_attempt_id
    AND existing_attempt.run_id = v_run_id
    AND existing_attempt.task_id = requested_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'execution attempt binding changed';
  END IF;

  IF run_row.actor_id <> requested_actor_id
     OR run_row.workspace_id <> attempt_row.workspace_id
     OR COALESCE(run_row.project_id, '') <> COALESCE(attempt_row.project_id, '')
     OR attempt_row.lease_generation IS DISTINCT FROM requested_lease_generation
     OR attempt_row.lease_token IS DISTINCT FROM requested_lease_token THEN
    RAISE EXCEPTION 'lease fencing token mismatch';
  END IF;

  v_event := jsonb_build_object(
    'kind', 'worker_outcome',
    'outcome', requested_outcome,
    'lease_generation', requested_lease_generation,
    'evidence', requested_evidence
  );

  -- Exact retries after a lost network response are safe and do not append a
  -- second copy of the evidence. A different result for the same attempt fails.
  IF COALESCE(attempt_row.evidence, '[]'::jsonb) @> jsonb_build_array(v_event) THEN
    RETURN true;
  END IF;

  IF run_row.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'execution run is not active';
  END IF;

  IF task_row.status NOT IN ('CLAIMED', 'IN_PROGRESS', 'VERIFYING')
     OR task_row.owner IS DISTINCT FROM requested_actor_id
     OR task_row.lease_generation IS DISTINCT FROM requested_lease_generation
     OR task_row.lease_token IS DISTINCT FROM requested_lease_token
     OR task_row.lease_expiry IS NULL
     OR task_row.lease_expiry <= clock_timestamp()
     OR task_row.workspace_id <> attempt_row.workspace_id
     OR COALESCE(task_row.project_id, '') <> COALESCE(attempt_row.project_id, '') THEN
    RAISE EXCEPTION 'active task lease is required';
  END IF;

  IF attempt_row.status NOT IN ('DISPATCHED', 'RUNNING', 'VERIFYING') THEN
    RAISE EXCEPTION 'execution attempt is not active';
  END IF;

  IF requested_outcome = 'VERIFYING' THEN
    -- Move to REVIEW while retaining the owner identity, so the separate
    -- reviewer rule can still prevent self-approval. REVIEW is not picked up
    -- by the expired-worker recovery loop.
    v_task_status := 'REVIEW';
    v_attempt_status := 'VERIFYING';
    v_run_status := 'COMPLETED';
    v_release_lease := false;
  ELSE
    v_task_status := 'BLOCKED';
    v_attempt_status := 'FAILED';
    v_run_status := 'FAILED';
    v_release_lease := true;
  END IF;

  UPDATE public.agent_tasks AS task
  SET status = v_task_status,
      evidence = COALESCE(task.evidence, '[]'::jsonb) || jsonb_build_array(v_event),
      owner = CASE WHEN v_release_lease THEN NULL ELSE task.owner END,
      lease_token = CASE WHEN v_release_lease THEN NULL ELSE task.lease_token END,
      lease_start = CASE WHEN v_release_lease THEN NULL ELSE task.lease_start END,
      lease_expiry = CASE WHEN v_release_lease THEN NULL ELSE task.lease_expiry END,
      last_heartbeat = CASE WHEN v_release_lease THEN NULL ELSE task.last_heartbeat END,
      updated_at = clock_timestamp()
  WHERE task.task_id = requested_task_id
    AND task.lease_generation = requested_lease_generation
    AND task.lease_token = requested_lease_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'lease changed during outcome persistence';
  END IF;

  UPDATE public.agent_execution_attempts AS existing_attempt
  SET status = v_attempt_status,
      evidence = COALESCE(existing_attempt.evidence, '[]'::jsonb) || jsonb_build_array(v_event),
      finished_at = CASE
        WHEN v_attempt_status = 'FAILED' THEN clock_timestamp()
        ELSE existing_attempt.finished_at
      END
  WHERE existing_attempt.attempt_id = requested_attempt_id
    AND existing_attempt.lease_generation = requested_lease_generation
    AND existing_attempt.lease_token = requested_lease_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'attempt lease changed during outcome persistence';
  END IF;

  UPDATE public.agent_execution_runs AS execution_run
  SET status = v_run_status,
      completed_at = clock_timestamp()
  WHERE execution_run.run_id = v_run_id
    AND execution_run.status = 'ACTIVE';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'execution run changed during outcome persistence';
  END IF;

  INSERT INTO public.agent_execution_audit (
    run_id, attempt_id, actor_id, workspace_id, task_id,
    action, result, evidence
  )
  VALUES (
    v_run_id, requested_attempt_id, requested_actor_id, task_row.workspace_id,
    requested_task_id, 'WORKER_OUTCOME', requested_outcome, v_event
  );

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_agent_attempt_outcome(UUID, TEXT, TEXT, BIGINT, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated, service_role;

DO $grant$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.record_agent_attempt_outcome(UUID, TEXT, TEXT, BIGINT, TEXT, TEXT, JSONB)
      TO service_role;
  END IF;
END
$grant$;
