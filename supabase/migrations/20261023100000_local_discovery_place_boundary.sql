-- Enforce the locality boundary for local_discovery needs at the database boundary.
--
-- local_discovery is not anonymous-public. It is readable only by an authenticated
-- user with an administrator-verified membership for the exact need place.
-- Parent/child inheritance is not implicit. Profile.place_id is deliberately not an authorization
-- signal. Membership administration is intentionally not exposed through PostgREST.
--
-- Do not apply this migration to any hosted project before owner-confirmed identity
-- and separate disposable-database evidence.

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.locality_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'revoked')),
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id),
  CHECK (
    (status = 'verified' AND verified_by IS NOT NULL AND verified_at IS NOT NULL)
    OR
    (status <> 'verified' AND verified_by IS NULL AND verified_at IS NULL)
  )
);

ALTER TABLE private.locality_memberships ENABLE ROW LEVEL SECURITY;

-- Never expose membership records or verification metadata directly to client roles.
REVOKE ALL ON TABLE private.locality_memberships FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE private.locality_memberships TO service_role;

CREATE INDEX IF NOT EXISTS locality_memberships_verified_user_place_idx
  ON private.locality_memberships (user_id, place_id)
  WHERE status = 'verified';

CREATE OR REPLACE FUNCTION private.is_verified_locality_member(_need_place_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT COALESCE(
    auth.uid() IS NOT NULL
    AND _need_place_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM private.locality_memberships AS membership
      WHERE membership.user_id = auth.uid()
        AND membership.place_id = _need_place_id
        AND membership.status = 'verified'
        AND membership.verified_by IS NOT NULL
        AND membership.verified_at IS NOT NULL
    ),
    false
  );
$function$;

REVOKE ALL ON FUNCTION private.is_verified_locality_member(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_verified_locality_member(uuid) TO authenticated;

-- Replace the previous global public-read policy. Public means globally readable;
-- local_discovery means a verified locality relationship is required.
DROP POLICY IF EXISTS "Public needs are readable by anyone" ON public.needs;
DROP POLICY IF EXISTS "Current public needs are readable by anyone" ON public.needs;
DROP POLICY IF EXISTS "Verified locality members can read local discovery needs" ON public.needs;

CREATE POLICY "Public needs are readable by anyone"
  ON public.needs
  FOR SELECT
  TO anon, authenticated
  USING (
    visibility = 'public'
    AND status = 'open'
  );

CREATE POLICY "Verified locality members can read local discovery needs"
  ON public.needs
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'local_discovery'
    AND status = 'open'
    AND private.is_verified_locality_member(place_id)
  );
