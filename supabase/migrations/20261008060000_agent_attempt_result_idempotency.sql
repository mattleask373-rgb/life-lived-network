-- Phase 11: idempotent durable attempt-result delivery.
-- Replays of the exact same fenced result are successful no-ops.
-- Conflicting result deliveries for the same attempt are rejected.
-- This migration extends the Phase 10 result boundary; it does not add
-- acceptance, integration, merge, deploy, approval, or production authority.

ALTER TABLE public.agent_execution_attempts
  ADD COLUMN IF NOT EXISTS result_fingerprint TEXT;

CREATE OR REPLACE FUNCTION public.record_agent_attempt_result(
  requested_attempt_id UUID,
  requested_run_id UUID,
  requested_task_id TEXT,
  requested_actor_id TEXT,
  requested_workspace_id TEXT,
  requested_project_id TEXT,
  requested_lease_generation BIGINT,
  requested_lease_token TEXT,
  requested_status TEXT,
  requested_evidence JSONB DEFAULT '{}'::jsonb
)
RETURNS SETOF public.agent_execution_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_row public.agent_execution_attempts;
  task_row public.agent_tasks;
  requested_fingerprint TEXT;
BEGIN
  IF requested_attempt_id IS NULL
     OR requested_run_id IS NULL
     OR NULLIF(btrim(requested_task_id), '') IS NULL
     OR NULLIF(btrim(requested_actor_id), '') IS NULL
     OR NULLIF(btrim(requested_workspace_id), '') IS NULL
     OR NULLIF(btrim(requested_project_id), '') IS NULL
     OR requested_lease_generation IS NULL
     OR NULLIF(btrim(requested_lease_token), '') IS NULL THEN
    RAISE EXCEPTION 'attempt identity, scope, and lease fence are required';
  END IF;

  IF requested_status NOT IN ('VERIFYING', 'FAILED') THEN
    RAISE EXCEPTION 'provider result status must be VERIFYING or FAILED';
  END IF;

  requested_evidence := COALESCE(requested_evidence, '{}'::jsonb);

  requested_fingerprint := md5(
    requested_status || '|' ||
    requested_evidence::text || '|' ||
    requested_actor_id || '|' ||
    requested_run_id::text || '|' ||
    requested_workspace_id || '|' ||
    requested_project_id || '|' ||
    requested_lease_generation::text || '|' ||
    requested_lease_token
  );

  SELECT * INTO attempt_row
  FROM public.agent_execution_attempts
  WHERE attempt_id = requested_attempt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'execution attempt not found';
  END IF;

  IF attempt_row.run_id <> requested_run_id
     OR attempt_row.task_id <> requested_task_id
     OR attempt_row.workspace_id <> requested_workspace_id
     OR COALESCE(attempt_row.project_id, '') <> requested_project_id
     OR attempt_row.lease_generation <> requested_lease_generation
     OR attempt_row.lease_token <> requested_lease_token THEN
    RAISE EXCEPTION 'attempt identity or scope mismatch';
  END IF;

  -- Exact replay is idempotent: return the already-recorded attempt without
  -- appending evidence or creating another audit event.
  IF attempt_row.result_fingerprint IS NOT NULL THEN
    IF attempt_row.result_fingerprint = requested_fingerprint THEN
      RETURN NEXT attempt_row;
      RETURN;
    END IF;
    RAISE EXCEPTION 'conflicting result already recorded for attempt';
  END IF;

  IF attempt_row.status NOT IN ('DISPATCHED', 'RUNNING', 'VERIFYING') THEN
    RAISE EXCEPTION 'attempt is no longer active: %', attempt_row.status;
  END IF;

  SELECT * INTO task_row
  FROM public.agent_tasks
  WHERE task_id = requested_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'task not found';
  END IF;

  IF task_row.workspace_id <> requested_workspace_id
     OR COALESCE(task_row.project_id, '') <> requested_project_id
     OR task_row.owner <> requested_actor_id
     OR task_row.lease_generation <> requested_lease_generation
     OR task_row.lease_token <> requested_lease_token THEN
    RAISE EXCEPTION 'current task lease fence or scope mismatch';
  END IF;

  IF task_row.status NOT IN ('CLAIMED', 'IN_PROGRESS', 'VERIFYING') THEN
    RAISE EXCEPTION 'task cannot accept attempt result from status %', task_row.status;
  END IF;

  IF task_row.lease_expiry IS NULL OR task_row.lease_expiry <= now() THEN
    RAISE EXCEPTION 'live lease required; stale work must be reclaimed before result submission';
  END IF;

  UPDATE public.agent_execution_attempts
  SET status = requested_status,
      result_fingerprint = requested_fingerprint,
      evidence = COALESCE(evidence, '[]'::jsonb) ||
        jsonb_build_array(
          jsonb_build_object(
            'kind', 'attempt_result',
            'status', requested_status,
            'recorded_at', now(),
            'actor_id', requested_actor_id,
            'lease_generation', requested_lease_generation,
            'evidence', requested_evidence
          )
        ),
      finished_at = CASE
        WHEN requested_status = 'FAILED' THEN COALESCE(finished_at, now())
        ELSE finished_at
      END
  WHERE attempt_id = requested_attempt_id
    AND status IN ('DISPATCHED', 'RUNNING', 'VERIFYING')
    AND lease_generation = requested_lease_generation
    AND lease_token = requested_lease_token
    AND result_fingerprint IS NULL
  RETURNING * INTO attempt_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'attempt changed during fenced result recording';
  END IF;

  INSERT INTO public.agent_execution_audit (
    run_id, attempt_id, actor_id, workspace_id, task_id,
    action, result, evidence
  )
  VALUES (
    requested_run_id,
    requested_attempt_id,
    requested_actor_id,
    requested_workspace_id,
    requested_task_id,
    'ATTEMPT_RESULT',
    requested_status,
    jsonb_build_object(
      'project_id', requested_project_id,
      'lease_generation', requested_lease_generation,
      'result_fingerprint', requested_fingerprint,
      'evidence', requested_evidence
    )
  );

  RETURN NEXT attempt_row;
END;
$$;

ALTER FUNCTION public.record_agent_attempt_result(
  UUID, UUID, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, JSONB
) RESTRICT;

REVOKE ALL ON FUNCTION public.record_agent_attempt_result(
  UUID, UUID, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, JSONB
) FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.record_agent_attempt_result(
      UUID, UUID, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, JSONB
    ) TO service_role;
  END IF;
END $$;
