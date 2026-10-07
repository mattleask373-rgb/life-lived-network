-- Hour 3: least-privilege EXECUTE + guarded CANCELLED transitions.
-- Aligns with src/lib/agent-state-machine.ts.

-- ---------------------------------------------------------------------------
-- 1. Least privilege: agent control-plane RPCs are service_role only.
--    Client roles (anon / authenticated) must never call these directly.
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.claim_agent_task(TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.heartbeat_agent_task(TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_agent_task(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_stale_agent_tasks(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reclaim_agent_task(TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC;

DO $$
BEGIN
  -- Roles may not exist in every local/test Postgres; guard grants.
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION public.claim_agent_task(TEXT, TEXT, INTEGER) FROM anon;
    REVOKE ALL ON FUNCTION public.heartbeat_agent_task(TEXT, TEXT, INTEGER) FROM anon;
    REVOKE ALL ON FUNCTION public.release_agent_task(TEXT, TEXT, TEXT) FROM anon;
    REVOKE ALL ON FUNCTION public.mark_stale_agent_tasks(INTEGER) FROM anon;
    REVOKE ALL ON FUNCTION public.reclaim_agent_task(TEXT, TEXT, INTEGER) FROM anon;
    REVOKE ALL ON FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON FUNCTION public.claim_agent_task(TEXT, TEXT, INTEGER) FROM authenticated;
    REVOKE ALL ON FUNCTION public.heartbeat_agent_task(TEXT, TEXT, INTEGER) FROM authenticated;
    REVOKE ALL ON FUNCTION public.release_agent_task(TEXT, TEXT, TEXT) FROM authenticated;
    REVOKE ALL ON FUNCTION public.mark_stale_agent_tasks(INTEGER) FROM authenticated;
    REVOKE ALL ON FUNCTION public.reclaim_agent_task(TEXT, TEXT, INTEGER) FROM authenticated;
    REVOKE ALL ON FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT) FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.claim_agent_task(TEXT, TEXT, INTEGER) TO service_role;
    GRANT EXECUTE ON FUNCTION public.heartbeat_agent_task(TEXT, TEXT, INTEGER) TO service_role;
    GRANT EXECUTE ON FUNCTION public.release_agent_task(TEXT, TEXT, TEXT) TO service_role;
    GRANT EXECUTE ON FUNCTION public.mark_stale_agent_tasks(INTEGER) TO service_role;
    GRANT EXECUTE ON FUNCTION public.reclaim_agent_task(TEXT, TEXT, INTEGER) TO service_role;
    GRANT EXECUTE ON FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT) TO service_role;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- 2. DONE is legacy-only. Keep column CHECK accepting DONE for old rows,
--    but transition_agent_task never accepts DONE as a destination.
--    Comment documents the policy for operators.
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN public.agent_tasks.status IS
  'Lifecycle status. DONE is legacy-only and not a legal transition destination; use ACCEPTED/INTEGRATED.';

-- ---------------------------------------------------------------------------
-- 3. Extend transition_agent_task with CANCELLED paths.
--    Full function body kept in sync with agent-state-machine.ts.
-- ---------------------------------------------------------------------------

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
  -- DONE is never a legal destination
  IF to_status = 'DONE' THEN
    RAISE EXCEPTION 'DONE is legacy-only and not a legal transition destination';
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
    actor_role := 'owner'; requires_lease := true;
  ELSIF from_status = 'IN_PROGRESS' AND to_status = 'VERIFYING' THEN
    actor_role := 'owner'; requires_lease := true;
  ELSIF from_status = 'VERIFYING' AND to_status = 'REVIEW' THEN
    actor_role := 'owner'; requires_lease := true;
  ELSIF from_status = 'REVIEW' AND to_status = 'ACCEPTED' THEN
    actor_role := 'reviewer'; forbid_self := true;
  ELSIF from_status = 'REVIEW' AND to_status = 'CHANGES_REQUESTED' THEN
    actor_role := 'reviewer'; forbid_self := true;
  ELSIF from_status = 'CHANGES_REQUESTED' AND to_status = 'IN_PROGRESS' THEN
    actor_role := 'owner'; renew_lease := true;
  ELSIF from_status = 'ACCEPTED' AND to_status = 'INTEGRATED' THEN
    actor_role := 'human';
  ELSIF from_status IN ('CLAIMED', 'IN_PROGRESS', 'VERIFYING') AND to_status = 'BLOCKED' THEN
    actor_role := 'owner'; requires_lease := true;
  ELSIF from_status = 'BLOCKED' AND to_status = 'READY' THEN
    actor_role := 'any_agent';
  ELSIF from_status IN ('CLAIMED', 'IN_PROGRESS', 'VERIFYING') AND to_status = 'STALE' THEN
    actor_role := 'system';
  ELSIF from_status = 'STALE' AND to_status = 'ABANDONED' THEN
    actor_role := 'any_agent';
  ELSIF from_status = 'ABANDONED' AND to_status = 'READY' THEN
    actor_role := 'any_agent';
  -- CANCELLED: owner may cancel active work; human/system may cancel broader states
  ELSIF from_status IN ('CLAIMED', 'IN_PROGRESS', 'VERIFYING', 'CHANGES_REQUESTED')
        AND to_status = 'CANCELLED' THEN
    actor_role := 'owner';
  ELSIF from_status IN ('READY', 'BLOCKED', 'STALE', 'REVIEW', 'ABANDONED')
        AND to_status = 'CANCELLED' THEN
    actor_role := 'human';
  ELSE
    RAISE EXCEPTION 'illegal transition % → %', from_status, to_status;
  END IF;

  IF actor_role = 'owner' THEN
    IF row.owner IS NULL OR row.owner <> actor THEN
      RAISE EXCEPTION 'actor is not the current owner';
    END IF;
  ELSIF actor_role = 'reviewer' THEN
    IF forbid_self AND row.owner IS NOT NULL AND row.owner = actor THEN
      RAISE EXCEPTION 'self-approval forbidden: implementer cannot accept own work';
    END IF;
  ELSIF actor_role = 'human' THEN
    IF actor <> 'human' AND actor NOT LIKE 'human:%' THEN
      RAISE EXCEPTION 'human actor required';
    END IF;
  ELSIF actor_role = 'system' THEN
    IF actor <> 'system' AND actor NOT LIKE 'system:%' THEN
      RAISE EXCEPTION 'system actor required';
    END IF;
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
    owner = CASE
      WHEN to_status IN ('CANCELLED', 'STALE', 'READY', 'ABANDONED') THEN NULL
      ELSE t.owner
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

REVOKE ALL ON FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT) TO service_role;
  END IF;
END
$$;
