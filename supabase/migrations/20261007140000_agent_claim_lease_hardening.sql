-- Harden claim/lease/heartbeat for concurrent, recoverable agent ownership.
-- Complements 20261007133000_agent_claim_leases.sql without rewriting history.

-- 1. Expand status domain to match docs/agents/STATE-MACHINE.md
ALTER TABLE public.agent_tasks
  DROP CONSTRAINT IF EXISTS agent_tasks_status_check;

ALTER TABLE public.agent_tasks
  ADD CONSTRAINT agent_tasks_status_check
  CHECK (status IN (
    'DISCOVERED',
    'READY',
    'CLAIMED',
    'IN_PROGRESS',
    'VERIFYING',
    'REVIEW',
    'CHANGES_REQUESTED',
    'ACCEPTED',
    'INTEGRATED',
    'BLOCKED',
    'STALE',
    'ABANDONED',
    'CANCELLED',
    'DONE'
  ));

-- 2. Drop redundant unique index (task_id is already UNIQUE).
-- Ownership exclusivity is enforced by the atomic UPDATE ... WHERE status = 'READY'
-- and by reclaim only accepting STALE rows.
DROP INDEX IF EXISTS public.agent_tasks_active_owner_idx;

-- 3. Heartbeat becomes a sliding lease: successful heartbeat extends lease_expiry.
CREATE OR REPLACE FUNCTION public.heartbeat_agent_task(
  requested_task_id TEXT,
  requested_owner TEXT,
  extend_minutes INTEGER DEFAULT 240
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
  IF extend_minutes < 1 OR extend_minutes > 1440 THEN
    RAISE EXCEPTION 'extend_minutes must be between 1 and 1440';
  END IF;

  RETURN QUERY
  UPDATE public.agent_tasks
  SET last_heartbeat = now(),
      lease_expiry = now() + make_interval(mins => extend_minutes),
      updated_at = now()
  WHERE task_id = requested_task_id
    AND owner = requested_owner
    AND status IN ('CLAIMED', 'IN_PROGRESS', 'VERIFYING')
    AND lease_expiry > now()
  RETURNING *;
END;
$$;

-- 4. Claim remains READY-only (atomic single-winner).
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

-- 5. Release: only current owner, only active ownership states.
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
    AND status IN ('CLAIMED', 'IN_PROGRESS', 'VERIFYING')
  RETURNING *;
END;
$$;

-- 6. Mark STALE: lease expired AND heartbeat grace exceeded (default 45 min).
-- Safe for concurrent callers: only rows still in active ownership states transition.
CREATE OR REPLACE FUNCTION public.mark_stale_agent_tasks(
  heartbeat_grace_minutes INTEGER DEFAULT 45
)
RETURNS SETOF public.agent_tasks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF heartbeat_grace_minutes < 1 OR heartbeat_grace_minutes > 1440 THEN
    RAISE EXCEPTION 'heartbeat_grace_minutes must be between 1 and 1440';
  END IF;

  RETURN QUERY
  UPDATE public.agent_tasks
  SET status = 'STALE',
      updated_at = now()
  WHERE status IN ('CLAIMED', 'IN_PROGRESS', 'VERIFYING')
    AND lease_expiry IS NOT NULL
    AND last_heartbeat IS NOT NULL
    AND lease_expiry < now()
    AND last_heartbeat < now() - make_interval(mins => heartbeat_grace_minutes)
  RETURNING *;
END;
$$;

-- 7. Reclaim: only from STALE (or READY for fresh claim path).
-- Never silently overwrites CLAIMED/IN_PROGRESS/VERIFYING with a live lease.
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
      status = 'CLAIMED',
      lease_start = now(),
      lease_expiry = now() + make_interval(mins => lease_minutes),
      last_heartbeat = now(),
      updated_at = now()
  WHERE task_id = requested_task_id
    AND status IN ('STALE', 'READY')
  RETURNING *;
END;
$$;

ALTER FUNCTION public.claim_agent_task(TEXT, TEXT, INTEGER) RESTRICT;
ALTER FUNCTION public.heartbeat_agent_task(TEXT, TEXT, INTEGER) RESTRICT;
ALTER FUNCTION public.release_agent_task(TEXT, TEXT, TEXT) RESTRICT;
ALTER FUNCTION public.mark_stale_agent_tasks(INTEGER) RESTRICT;
ALTER FUNCTION public.reclaim_agent_task(TEXT, TEXT, INTEGER) RESTRICT;
