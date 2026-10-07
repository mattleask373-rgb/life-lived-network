-- Remove the legacy unfenced heartbeat overload after Hour-5 fencing landed.
DROP FUNCTION IF EXISTS public.heartbeat_agent_task(TEXT, TEXT);

-- The only callable heartbeat now requires the fencing generation + opaque token.
REVOKE ALL ON FUNCTION public.heartbeat_agent_task(TEXT, TEXT, INTEGER, BIGINT, TEXT) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.heartbeat_agent_task(TEXT, TEXT, INTEGER, BIGINT, TEXT) TO service_role;
  END IF;
END $$;
