-- Phase reclaim: after MARK_STALE, reclaim requires authoritative STALE,
-- rotates lease generation/token, and abandons active attempts from the
-- previous generation. Terminal FAILED/SUCCEEDED history is preserved.
--
-- NOT LIVE: service_role only; no merge/deploy authority.

CREATE OR REPLACE FUNCTION public.reclaim_stale_agent_task(
  requested_task_id TEXT,
  requested_actor_id TEXT,
  requested_workspace_id TEXT,
  requested_project_id TEXT,
  requested_run_id UUID DEFAULT NULL
)
RETURNS TABLE (
  task_id TEXT,
  status TEXT,
  lease_generation BIGINT,
  lease_token TEXT,
  abandoned_attempt_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_row public.agent_tasks;
  new_generation BIGINT;
  new_token TEXT;
  abandoned_count INTEGER := 0;
BEGIN
  IF NULLIF(btrim(requested_task_id), '') IS NULL
     OR NULLIF(btrim(requested_actor_id), '') IS NULL
     OR NULLIF(btrim(requested_workspace_id), '') IS NULL
     OR NULLIF(btrim(requested_project_id), '') IS NULL THEN
    RAISE EXCEPTION 'reclaim identity and scope are required';
  END IF;

  SELECT * INTO task_row
  FROM public.agent_tasks
  WHERE task_id = requested_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'task not found';
  END IF;

  IF task_row.status <> 'STALE' THEN
    RAISE EXCEPTION 'reclaim requires authoritative STALE status, found %', task_row.status;
  END IF;

  IF task_row.workspace_id <> requested_workspace_id
     OR COALESCE(task_row.project_id, '') <> requested_project_id THEN
    RAISE EXCEPTION 'task scope mismatch';
  END IF;

  new_generation := COALESCE(task_row.lease_generation, 0) + 1;
  new_token := gen_random_uuid()::text;

  -- Abandon active attempts from previous generation only.
  UPDATE public.agent_execution_attempts
  SET status = 'ABANDONED',
      finished_at = COALESCE(finished_at, now()),
      evidence = COALESCE(evidence, '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
          'kind', 'reclaim_abandon',
          'reason', 'stale generation after reclaim',
          'old_lease_generation', lease_generation,
          'new_lease_generation', new_generation,
          'reclaimed_at', now(),
          'actor_id', requested_actor_id
        )
      )
  WHERE task_id = requested_task_id
    AND status IN ('DISPATCHED', 'RUNNING', 'VERIFYING', 'STALE')
    AND lease_generation < new_generation;

  GET DIAGNOSTICS abandoned_count = ROW_COUNT;

  UPDATE public.agent_tasks
  SET status = 'READY',
      owner = NULL,
      lease_generation = new_generation,
      lease_token = new_token,
      lease_start = NULL,
      lease_expiry = NULL,
      last_heartbeat = NULL,
      updated_at = now()
  WHERE task_id = requested_task_id
    AND status = 'STALE';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'task changed during reclaim';
  END IF;

  INSERT INTO public.agent_execution_audit (
    run_id, attempt_id, actor_id, workspace_id, task_id,
    action, result, evidence
  )
  VALUES (
    requested_run_id,
    NULL,
    requested_actor_id,
    requested_workspace_id,
    requested_task_id,
    'RECLAIM',
    'READY',
    jsonb_build_object(
      'project_id', requested_project_id,
      'lease_generation', new_generation,
      'abandoned_attempt_count', abandoned_count
    )
  );

  RETURN QUERY SELECT
    requested_task_id,
    'READY'::TEXT,
    new_generation,
    new_token,
    abandoned_count;
END;
$$;

ALTER FUNCTION public.reclaim_stale_agent_task(TEXT, TEXT, TEXT, TEXT, UUID) RESTRICT;
REVOKE ALL ON FUNCTION public.reclaim_stale_agent_task(TEXT, TEXT, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.reclaim_stale_agent_task(TEXT, TEXT, TEXT, TEXT, UUID)
      TO service_role;
  END IF;
END $$;
