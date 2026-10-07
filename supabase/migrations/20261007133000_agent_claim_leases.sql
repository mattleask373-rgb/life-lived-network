-- Durable ownership for provider-neutral agent execution.
ALTER TABLE public.agent_tasks
  ADD COLUMN IF NOT EXISTS owner TEXT,
  ADD COLUMN IF NOT EXISTS backup_owner TEXT,
  ADD COLUMN IF NOT EXISTS lease_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lease_expiry TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS touched_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reviewer TEXT,
  ADD COLUMN IF NOT EXISTS handoff JSONB,
  ADD COLUMN IF NOT EXISTS blocker JSONB;

CREATE INDEX IF NOT EXISTS agent_tasks_lease_idx
  ON public.agent_tasks (status, lease_expiry, last_heartbeat);

CREATE UNIQUE INDEX IF NOT EXISTS agent_tasks_active_owner_idx
  ON public.agent_tasks (task_id)
  WHERE status IN ('CLAIMED', 'VERIFYING');

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

CREATE OR REPLACE FUNCTION public.heartbeat_agent_task(
  requested_task_id TEXT,
  requested_owner TEXT
)
RETURNS SETOF public.agent_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.agent_tasks
  SET last_heartbeat = now(),
      updated_at = now()
  WHERE task_id = requested_task_id
    AND owner = requested_owner
    AND status IN ('CLAIMED', 'VERIFYING')
    AND lease_expiry > now()
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_agent_task(
  requested_task_id TEXT,
  requested_owner TEXT,
  next_status TEXT DEFAULT 'READY'
)
RETURNS SETOF public.agent_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF next_status NOT IN ('READY', 'BLOCKED') THEN
    RAISE EXCEPTION 'release status must be READY or BLOCKED';
  END IF;

  RETURN QUERY
  UPDATE public.agent_tasks
  SET owner = NULL,
      lease_start = NULL,
      lease_expiry = NULL,
      last_heartbeat = NULL,
      status = next_status,
      updated_at = now()
  WHERE task_id = requested_task_id
    AND owner = requested_owner
    AND status IN ('CLAIMED', 'VERIFYING')
  RETURNING *;
END;
$$;

ALTER FUNCTION public.claim_agent_task(TEXT, TEXT, INTEGER) RESTRICT;
ALTER FUNCTION public.heartbeat_agent_task(TEXT, TEXT) RESTRICT;
ALTER FUNCTION public.release_agent_task(TEXT, TEXT, TEXT) RESTRICT;
