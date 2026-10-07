-- Hour-5 hardening: fenced leases and append-only completion evidence.
-- Canonical control-plane boundary: stale workers must never mutate a reclaimed task.

ALTER TABLE public.agent_tasks
  ADD COLUMN IF NOT EXISTS lease_generation BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lease_token TEXT;

CREATE TABLE IF NOT EXISTS public.agent_task_completions (
  completion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL REFERENCES public.agent_tasks(task_id) ON DELETE RESTRICT,
  lease_generation BIGINT NOT NULL,
  actor TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('REVIEW', 'ACCEPTED', 'INTEGRATED')),
  evidence JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, lease_generation)
);

CREATE INDEX IF NOT EXISTS agent_task_completions_task_idx
  ON public.agent_task_completions (task_id, created_at DESC);

ALTER TABLE public.agent_task_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agent_task_completions_no_client_access" ON public.agent_task_completions;
CREATE POLICY "agent_task_completions_no_client_access"
  ON public.agent_task_completions
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- Replace the historical transition overload with a fenced version.
DROP FUNCTION IF EXISTS public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT);

CREATE OR REPLACE FUNCTION public.transition_agent_task(
  requested_task_id TEXT,
  actor TEXT,
  to_status TEXT,
  evidence JSONB DEFAULT NULL,
  reviewer TEXT DEFAULT NULL,
  requested_lease_generation BIGINT DEFAULT NULL,
  requested_lease_token TEXT DEFAULT NULL
)
RETURNS SETOF public.agent_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.agent_tasks;
  lease_required BOOLEAN := false;
  actor_role TEXT;
  next_generation BIGINT;
BEGIN
  IF actor IS NULL OR btrim(actor) = '' THEN
    RAISE EXCEPTION 'actor is required';
  END IF;
  IF to_status IS NULL OR btrim(to_status) = '' THEN
    RAISE EXCEPTION 'to_status is required';
  END IF;
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

  IF row.status = to_status THEN
    RAISE EXCEPTION 'no-op transition % → %', row.status, to_status;
  END IF;

  IF (row.status = 'CLAIMED' AND to_status = 'IN_PROGRESS')
     OR (row.status = 'IN_PROGRESS' AND to_status = 'VERIFYING')
     OR (row.status = 'VERIFYING' AND to_status = 'REVIEW')
     OR (row.status IN ('CLAIMED','IN_PROGRESS','VERIFYING') AND to_status = 'BLOCKED')
     OR (row.status = 'CHANGES_REQUESTED' AND to_status = 'IN_PROGRESS') THEN
    lease_required := true;
    actor_role := 'owner';
  ELSIF row.status = 'REVIEW' AND to_status IN ('ACCEPTED','CHANGES_REQUESTED') THEN
    actor_role := 'reviewer';
  ELSIF row.status = 'ACCEPTED' AND to_status = 'INTEGRATED' THEN
    actor_role := 'human';
  ELSIF row.status IN ('CLAIMED','IN_PROGRESS','VERIFYING') AND to_status = 'STALE' THEN
    actor_role := 'system';
  ELSIF row.status IN ('BLOCKED') AND to_status = 'READY' THEN
    actor_role := 'any_agent';
  ELSIF row.status = 'STALE' AND to_status = 'ABANDONED' THEN
    actor_role := 'any_agent';
  ELSIF row.status = 'ABANDONED' AND to_status = 'READY' THEN
    actor_role := 'any_agent';
  ELSIF row.status IN ('CLAIMED','IN_PROGRESS','VERIFYING','CHANGES_REQUESTED') AND to_status = 'CANCELLED' THEN
    actor_role := 'owner';
  ELSIF row.status IN ('READY','BLOCKED','STALE','REVIEW','ABANDONED') AND to_status = 'CANCELLED' THEN
    actor_role := 'human';
  ELSE
    RAISE EXCEPTION 'illegal transition % → %', row.status, to_status;
  END IF;

  IF actor_role = 'owner' THEN
    IF row.owner IS NULL OR row.owner <> actor THEN
      RAISE EXCEPTION 'actor is not the current owner';
    END IF;
    IF requested_lease_generation IS NULL OR requested_lease_token IS NULL THEN
      RAISE EXCEPTION 'lease generation and token are required for owner transition';
    END IF;
    IF requested_lease_generation <> row.lease_generation
       OR requested_lease_token <> row.lease_token THEN
      RAISE EXCEPTION 'lease fencing token mismatch';
    END IF;
    IF lease_required AND (row.lease_expiry IS NULL OR row.lease_expiry <= now()) THEN
      RAISE EXCEPTION 'live lease required; mark STALE and reclaim if expired';
    END IF;
  ELSIF actor_role = 'reviewer' THEN
    IF row.owner IS NOT NULL AND row.owner = actor THEN
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

  IF actor_role = 'owner' AND to_status = 'REVIEW' THEN
    INSERT INTO public.agent_task_completions(task_id, lease_generation, actor, status, evidence)
    VALUES (row.task_id, row.lease_generation, actor, 'REVIEW', evidence)
    ON CONFLICT (task_id, lease_generation) DO NOTHING;
  END IF;

  next_generation := row.lease_generation;

  UPDATE public.agent_tasks t
  SET status = to_status,
      updated_at = now(),
      reviewer = CASE WHEN actor_role = 'reviewer' THEN COALESCE(reviewer, actor) ELSE t.reviewer END,
      evidence = CASE
        WHEN evidence IS NOT NULL THEN COALESCE(t.evidence, '[]'::jsonb) || jsonb_build_array(evidence)
        ELSE t.evidence
      END,
      owner = CASE
        WHEN to_status IN ('STALE','READY','ABANDONED','CANCELLED') THEN NULL
        ELSE t.owner
      END,
      lease_token = CASE
        WHEN to_status IN ('STALE','READY','ABANDONED','CANCELLED','INTEGRATED') THEN NULL
        ELSE t.lease_token
      END,
      lease_start = CASE
        WHEN to_status IN ('STALE','READY','ABANDONED','CANCELLED','INTEGRATED') THEN NULL
        ELSE t.lease_start
      END,
      lease_expiry = CASE
        WHEN to_status IN ('STALE','READY','ABANDONED','CANCELLED','INTEGRATED') THEN NULL
        ELSE t.lease_expiry
      END,
      last_heartbeat = CASE
        WHEN to_status IN ('STALE','READY','ABANDONED','CANCELLED','INTEGRATED') THEN NULL
        ELSE t.last_heartbeat
      END
  WHERE t.task_id = requested_task_id
    AND (actor_role <> 'owner'
      OR (t.lease_generation = requested_lease_generation AND t.lease_token = requested_lease_token))
  RETURNING * INTO row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'lease changed during transition; retry with current lease';
  END IF;

  RETURN NEXT row;
END;
$$;

ALTER FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT, BIGINT, TEXT) RESTRICT;
REVOKE ALL ON FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT, BIGINT, TEXT) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.transition_agent_task(TEXT, TEXT, TEXT, JSONB, TEXT, BIGINT, TEXT) TO service_role;
  END IF;
END $$;

-- Re-define claim/reclaim/heartbeat with fencing fields.
CREATE OR REPLACE FUNCTION public.claim_agent_task(
  requested_task_id TEXT,
  requested_owner TEXT,
  lease_minutes INTEGER DEFAULT 240
)
RETURNS SETOF public.agent_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF requested_owner IS NULL OR btrim(requested_owner) = '' THEN
    RAISE EXCEPTION 'owner is required';
  END IF;
  IF lease_minutes < 1 OR lease_minutes > 1440 THEN
    RAISE EXCEPTION 'lease_minutes must be between 1 and 1440';
  END IF;

  RETURN QUERY
  UPDATE public.agent_tasks
  SET owner = requested_owner,
      lease_generation = lease_generation + 1,
      lease_token = gen_random_uuid()::text,
      status = 'CLAIMED',
      lease_start = now(),
      lease_expiry = now() + make_interval(mins => lease_minutes),
      last_heartbeat = now(),
      updated_at = now()
  WHERE task_id = requested_task_id
    AND status = 'READY'
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION public.reclaim_agent_task(
  requested_task_id TEXT,
  requested_owner TEXT,
  lease_minutes INTEGER DEFAULT 240
)
RETURNS SETOF public.agent_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF requested_owner IS NULL OR btrim(requested_owner) = '' THEN
    RAISE EXCEPTION 'owner is required';
  END IF;
  IF lease_minutes < 1 OR lease_minutes > 1440 THEN
    RAISE EXCEPTION 'lease_minutes must be between 1 and 1440';
  END IF;

  RETURN QUERY
  UPDATE public.agent_tasks
  SET owner = requested_owner,
      lease_generation = lease_generation + 1,
      lease_token = gen_random_uuid()::text,
      status = 'CLAIMED',
      lease_start = now(),
      lease_expiry = now() + make_interval(mins => lease_minutes),
      last_heartbeat = now(),
      updated_at = now()
  WHERE task_id = requested_task_id
    AND status IN ('STALE','READY')
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION public.heartbeat_agent_task(
  requested_task_id TEXT,
  requested_owner TEXT,
  extend_minutes INTEGER DEFAULT 240,
  requested_lease_generation BIGINT DEFAULT NULL,
  requested_lease_token TEXT DEFAULT NULL
)
RETURNS SETOF public.agent_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF requested_owner IS NULL OR btrim(requested_owner) = '' THEN
    RAISE EXCEPTION 'owner is required';
  END IF;
  IF requested_lease_generation IS NULL OR requested_lease_token IS NULL THEN
    RAISE EXCEPTION 'lease generation and token are required';
  END IF;

  RETURN QUERY
  UPDATE public.agent_tasks
  SET last_heartbeat = now(),
      lease_expiry = now() + make_interval(mins => extend_minutes),
      updated_at = now()
  WHERE task_id = requested_task_id
    AND owner = requested_owner
    AND lease_generation = requested_lease_generation
    AND lease_token = requested_lease_token
    AND status IN ('CLAIMED','IN_PROGRESS','VERIFYING')
    AND lease_expiry > now()
  RETURNING *;
END;
$$;

ALTER FUNCTION public.claim_agent_task(TEXT,TEXT,INTEGER) RESTRICT;
ALTER FUNCTION public.reclaim_agent_task(TEXT,TEXT,INTEGER) RESTRICT;
ALTER FUNCTION public.heartbeat_agent_task(TEXT,TEXT,INTEGER,BIGINT,TEXT) RESTRICT;

REVOKE ALL ON FUNCTION public.claim_agent_task(TEXT,TEXT,INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reclaim_agent_task(TEXT,TEXT,INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.heartbeat_agent_task(TEXT,TEXT,INTEGER,BIGINT,TEXT) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.claim_agent_task(TEXT,TEXT,INTEGER) TO service_role;
    GRANT EXECUTE ON FUNCTION public.reclaim_agent_task(TEXT,TEXT,INTEGER) TO service_role;
    GRANT EXECUTE ON FUNCTION public.heartbeat_agent_task(TEXT,TEXT,INTEGER,BIGINT,TEXT) TO service_role;
  END IF;
END $$;
