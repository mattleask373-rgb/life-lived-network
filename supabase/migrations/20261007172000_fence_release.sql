-- Fence release as well as heartbeat/transition. No owner mutation may rely on owner text alone.
DROP FUNCTION IF EXISTS public.release_agent_task(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.release_agent_task(
  requested_task_id TEXT,
  requested_owner TEXT,
  next_status TEXT DEFAULT 'READY',
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
  IF next_status NOT IN ('READY', 'BLOCKED') THEN
    RAISE EXCEPTION 'release status must be READY or BLOCKED';
  END IF;

  RETURN QUERY
  UPDATE public.agent_tasks
  SET owner = NULL,
      lease_token = NULL,
      lease_start = NULL,
      lease_expiry = NULL,
      last_heartbeat = NULL,
      status = next_status,
      updated_at = now()
  WHERE task_id = requested_task_id
    AND owner = requested_owner
    AND lease_generation = requested_lease_generation
    AND lease_token = requested_lease_token
    AND status IN ('CLAIMED','IN_PROGRESS','VERIFYING')
  RETURNING *;
END;
$$;

ALTER FUNCTION public.release_agent_task(TEXT,TEXT,TEXT,BIGINT,TEXT) RESTRICT;
REVOKE ALL ON FUNCTION public.release_agent_task(TEXT,TEXT,TEXT,BIGINT,TEXT) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.release_agent_task(TEXT,TEXT,TEXT,BIGINT,TEXT) TO service_role;
  END IF;
END $$;
