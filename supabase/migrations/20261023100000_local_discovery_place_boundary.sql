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
  -- Membership authorization expires after 180 days unless an administrator re-verifies it.
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '180 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id),
  CHECK (
    (status = 'verified' AND verified_by IS NOT NULL AND verified_at IS NOT NULL)
    OR
    (status <> 'verified' AND verified_by IS NULL AND verified_at IS NULL)
  )
);

-- If the account that verified a membership is deleted, revoke that membership
-- in the same referential action. This keeps account deletion possible without
-- leaving a verified row that has lost its verifier or blocking deletion through
-- the existing verified-row CHECK constraint.
CREATE OR REPLACE FUNCTION private.revoke_locality_membership_when_verifier_removed()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  IF OLD.status = 'verified'
     AND OLD.verified_by IS NOT NULL
     AND NEW.verified_by IS NULL THEN
    NEW.status := 'revoked';
    NEW.verified_at := NULL;
    NEW.updated_at := pg_catalog.clock_timestamp();
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.revoke_locality_membership_when_verifier_removed()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER revoke_membership_when_verifier_removed
  BEFORE UPDATE OF verified_by ON private.locality_memberships
  FOR EACH ROW
  EXECUTE FUNCTION private.revoke_locality_membership_when_verifier_removed();

ALTER TABLE private.locality_memberships ENABLE ROW LEVEL SECURITY;

-- Never expose membership records or verification metadata directly to client roles.
REVOKE ALL ON TABLE private.locality_memberships FROM PUBLIC, anon, authenticated, service_role;

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
        AND membership.expires_at > pg_catalog.statement_timestamp()
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

-- PostgreSQL combines permissive SELECT policies with OR. The historic creator
-- policy would otherwise let a creator read their own local_discovery row without
-- verified place membership, bypassing the boundary below. Preserve owner reads
-- for public needs (including stale/closed public rows), but never local_discovery.
DROP POLICY IF EXISTS "People can read their own needs" ON public.needs;
CREATE POLICY "People can read their own needs"
  ON public.needs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id AND visibility = 'public');

CREATE POLICY "Public needs are readable by anyone"
  ON public.needs
  FOR SELECT
  TO anon, authenticated
  USING (
    visibility = 'public'
    AND status = 'open'
    AND (expires_at IS NULL OR expires_at > now())
    AND (ends_at IS NULL OR ends_at > now())
    AND last_confirmed_at > now() - interval '30 days'
  );

CREATE POLICY "Verified locality members can read local discovery needs"
  ON public.needs
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'local_discovery'
    AND status = 'open'
    AND (expires_at IS NULL OR expires_at > now())
    AND (ends_at IS NULL OR ends_at > now())
    AND last_confirmed_at > now() - interval '30 days'
    AND private.is_verified_locality_member(place_id)
  );
