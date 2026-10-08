-- Phase 10: durable attempt result boundary.
-- Server-only, fenced by actor + run + task + workspace + project +
-- current lease generation/token. Provider results remain evidence and
-- can only move an active attempt to VERIFYING or FAILED.
--
-- This does not grant acceptance, integration, merge, deploy, or approval authority.

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

  IF requested_evidence IS NULL THEN
    requested_evidence := '{}'::jsonb;
  END IF;

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
