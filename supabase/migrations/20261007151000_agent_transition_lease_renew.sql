-- When resuming from CHANGES_REQUESTED → IN_PROGRESS, renew the owner lease
-- so the implementer is not stuck without a live lease after review lag.

CREATE OR REPLACE FUNCTION public.transition_agent_task(
  requested_task_id TEXT,
  actor TEXT,
  to_status TEXT,
  evidence JSONB DEFAULT NULL,
  reviewer TEXT DEFAULT NULL
)
RETURNS SETOF public.agent_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.agent_tasks;
  from_status TEXT;
  lease_ok BOOLEAN;
  role_ok BOOLEAN := false;
  requires_lease BOOLEAN := false;
  forbid_self BOOLEAN := false;
  actor_role TEXT;
  renew_lease BOOLEAN := false;
BEGIN
  IF actor IS NULL OR btrim(actor) = '' THEN
    RAISE EXCEPTION 'actor is required';
  END IF;
  IF to_status IS NULL OR btrim(to_status) = '' THEN
    RAISE EXCEPTION 'to_status is required';
  END IF;

  SELECT * INTO row
  FROM public.agent_tasks
  WHERE task_id = requested_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'task not found: %', requested_task_id;
  END IF;

  from_status := row.status;

  IF from_status = to_status THEN
    RAISE EXCEPTION 'no-op transition % → %', from_status, to_status;
  END IF;

  IF from_status = 'CLAIMED' AND to_status = 'IN_PROGRESS' THEN
    actor_role := 'owner'; requires_lease := true; forbid_self := false;
  ELSIF from_status = 'IN_PROGRESS' AND to_status = 'VERIFYING' THEN
    actor_role := 'owner'; requires_lease := true; forbid_self := false;
  ELSIF from_status = 'VERIFYING' AND to_status = 'REVIEW' THEN
    actor_role := 'owner'; requires_lease := true; forbid_self := false;
  ELSIF from_status = 'REVIEW' AND to_status = 'ACCEPTED' THEN
    actor_role := 'reviewer'; requires_lease := false; forbid_self := true;
  ELSIF from_status = 'REVIEW' AND to_status = 'CHANGES_REQUESTED' THEN
    actor_role := 'reviewer'; requires_lease := false; forbid_self := true;
  ELSIF from_status = 'CHANGES_REQUESTED' AND to_status = 'IN_PROGRESS' THEN
    actor_role := 'owner'; requires_lease := false; forbid_self := false; renew_lease := true;
  ELSIF from_status = 'ACCEPTED' AND to_status = 'INTEGRATED' THEN
    actor_role := 'human'; requires_lease := false; forbid_self := false;
  ELSIF from_status IN ('CLAIMED', 'IN_PROGRESS', 'VERIFYING') AND to_status = 'BLOCKED' THEN
    actor_role := 'owner'; requires_lease := true; forbid_self := false;
  ELSIF from_status = 'BLOCKED' AND to_status = 'READY' THEN
    actor_role := 'any_agent'; requires_lease := false; forbid_self := false;
  ELSIF from_status IN ('CLAIMED', 'IN_PROGRESS', 'VERIFYING') AND to_status = 'STALE' THEN
    actor_role := 'system'; requires_lease := false; forbid_self := false;
  ELSIF from_status = 'STALE' AND to_status = 'ABANDONED' THEN
    actor_role := 'any_agent'; requires_lease := false; forbid_self := false;
  ELSIF from_status = 'ABANDONED' AND to_status = 'READY' THEN
    actor_role := 'any_agent'; requires_lease := false; forbid_self := false;
  ELSE
    RAISE EXCEPTION 'illegal transition % → %', from_status, to_status;
  END IF;

  IF actor_role = 'owner' THEN
    role_ok := (row.owner IS NOT NULL AND row.owner = actor);
    IF NOT role_ok THEN
      RAISE EXCEPTION 'actor is not the current owner';
    END IF;
  ELSIF actor_role = 'reviewer' THEN
    IF forbid_self AND row.owner IS NOT NULL AND row.owner = actor THEN
      RAISE EXCEPTION 'self-approval forbidden: implementer cannot accept own work';
    END IF;
    role_ok := true;
  ELSIF actor_role = 'human' THEN
    role_ok := (actor = 'human' OR actor LIKE 'human:%');
    IF NOT role_ok THEN
      RAISE EXCEPTION 'INTEGRATED requires human actor';
    END IF;
  ELSIF actor_role = 'system' THEN
    role_ok := (actor = 'system' OR actor LIKE 'system:%');
    IF NOT role_ok THEN
      RAISE EXCEPTION 'system actor required';
    END IF;
  ELSIF actor_role = 'any_agent' THEN
    role_ok := true;
  END IF;

  lease_ok := (
    row.lease_expiry IS NOT NULL
    AND row.lease_expiry > now()
    AND row.owner IS NOT NULL
  );

  IF requires_lease AND NOT lease_ok THEN
    RAISE EXCEPTION 'live lease required; mark STALE and reclaim if expired';
  END IF;

  UPDATE public.agent_tasks t
  SET
    status = to_status,
    updated_at = now(),
    reviewer = CASE
      WHEN actor_role = 'reviewer' THEN COALESCE(reviewer, actor)
      ELSE t.reviewer
    END,
    evidence = CASE
      WHEN evidence IS NOT NULL THEN COALESCE(t.evidence, '[]'::jsonb) || jsonb_build_array(evidence)
      ELSE t.evidence
    END,
    lease_start = CASE
      WHEN renew_lease THEN now()
      WHEN to_status IN ('STALE', 'READY', 'ABANDONED', 'CANCELLED', 'INTEGRATED') THEN NULL
      ELSE t.lease_start
    END,
    lease_expiry = CASE
      WHEN renew_lease THEN now() + interval '240 minutes'
      WHEN to_status IN ('STALE', 'READY', 'ABANDONED', 'CANCELLED', 'INTEGRATED') THEN NULL
      ELSE t.lease_expiry
    END,
    last_heartbeat = CASE
      WHEN renew_lease THEN now()
      WHEN to_status IN ('STALE', 'READY', 'ABANDONED', 'CANCELLED', 'INTEGRATED') THEN NULL
      ELSE t.last_heartbeat
    END
  WHERE t.task_id = requested_task_id
  RETURNING * INTO row;

  RETURN NEXT row;
  RETURN;
END;
$$;

ALTER FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT) RESTRICT;
