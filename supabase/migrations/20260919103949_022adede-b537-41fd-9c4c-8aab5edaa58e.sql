CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;
CREATE OR REPLACE FUNCTION private.people_are_blocked(_first uuid, _second uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _first AND blocked_id = _second)
       OR (blocker_id = _second AND blocked_id = _first)
  )
$$;
REVOKE ALL ON FUNCTION private.people_are_blocked(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.people_are_blocked(uuid, uuid) TO service_role;
DROP FUNCTION public.people_are_blocked(uuid, uuid);