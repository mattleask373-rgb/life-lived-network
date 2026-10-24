-- Governed, auditable provisioning for exact-place locality membership.
-- This migration depends on the private.locality_memberships table and
-- private.is_verified_locality_member(uuid) helper from #348.
-- No client role can read or mutate the audit table or invoke this RPC.
-- The application performs an admin role check before calling it; the RPC
-- repeats the admin authorization check and runs membership + audit writes atomically.

CREATE TABLE IF NOT EXISTS private.locality_membership_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  place_id uuid REFERENCES public.places(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('grant', 'revoke')),
  reason_code text NOT NULL CHECK (
    reason_code IN (
      'locality_relationship_verified',
      'local_steward_attestation',
      'member_request',
      'verification_expired',
      'steward_review',
      'admin_correction'
    )
  ),
  verification_method text CHECK (
    verification_method IS NULL OR verification_method IN (
      'in_person',
      'local_steward',
      'document_checked',
      'other_reviewed'
    )
  ),
  evidence_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (action = 'grant'
      AND verification_method IS NOT NULL
      AND evidence_reference IS NOT NULL
      AND btrim(evidence_reference) <> ''
      AND length(evidence_reference) <= 160)
    OR
    (action = 'revoke'
      AND verification_method IS NULL
      AND evidence_reference IS NULL)
  )
);

ALTER TABLE private.locality_membership_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.locality_membership_events FROM PUBLIC, anon, authenticated, service_role;
CREATE INDEX IF NOT EXISTS locality_membership_events_subject_idx
  ON private.locality_membership_events (subject_user_id, place_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.review_locality_membership(
  _action text,
  _actor_id uuid,
  _user_id uuid,
  _place_id uuid,
  _verification_method text,
  _evidence_reference text,
  _reason_code text
)
RETURNS TABLE (
  membership_id uuid,
  membership_status text,
  audit_event_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_membership_id uuid;
  v_status text;
  v_event_id uuid;
  v_method text;
  v_evidence text;
BEGIN
  -- The RPC is only a server-side service-role primitive. The application
  -- must independently authenticate and authorize the invoking admin.
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service-role invocation required' USING ERRCODE = '42501';
  END IF;

  IF _actor_id IS NULL OR _user_id IS NULL OR _place_id IS NULL THEN
    RAISE EXCEPTION 'actor, user and place are required' USING ERRCODE = '22023';
  END IF;

  IF _actor_id = _user_id THEN
    RAISE EXCEPTION 'administrators cannot approve or revoke their own locality membership'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles AS role_record
    WHERE role_record.user_id = _actor_id
      AND role_record.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'actor must be a current administrator' USING ERRCODE = '42501';
  END IF;

  IF _action = 'grant' THEN
    IF _reason_code IS NULL OR _reason_code NOT IN ('locality_relationship_verified', 'local_steward_attestation') THEN
      RAISE EXCEPTION 'unsupported grant reason' USING ERRCODE = '22023';
    END IF;
    IF _verification_method IS NULL OR _verification_method NOT IN ('in_person', 'local_steward', 'document_checked', 'other_reviewed') THEN
      RAISE EXCEPTION 'verification method is required' USING ERRCODE = '22023';
    END IF;
    v_evidence := btrim(COALESCE(_evidence_reference, ''));
    IF v_evidence = ''
       OR length(v_evidence) > 160
       OR v_evidence ~ '[^A-Za-z0-9._:/-]'
       OR pg_catalog.strpos(pg_catalog.lower(v_evidence), 'http://') > 0
       OR pg_catalog.strpos(pg_catalog.lower(v_evidence), 'https://') > 0 THEN
      RAISE EXCEPTION 'a short opaque evidence reference is required' USING ERRCODE = '22023';
    END IF;

    INSERT INTO private.locality_memberships (
      user_id, place_id, status, verified_by, verified_at, expires_at, updated_at
    )
    VALUES (
      _user_id, _place_id, 'verified', _actor_id,
      pg_catalog.clock_timestamp(),
      pg_catalog.clock_timestamp() + interval '180 days',
      pg_catalog.clock_timestamp()
    )
    ON CONFLICT (user_id, place_id) DO UPDATE
    SET status = 'verified',
        verified_by = EXCLUDED.verified_by,
        verified_at = EXCLUDED.verified_at,
        expires_at = EXCLUDED.expires_at,
        updated_at = EXCLUDED.updated_at
    RETURNING id, status INTO v_membership_id, v_status;

    v_method := _verification_method;
  ELSIF _action = 'revoke' THEN
    IF _reason_code IS NULL OR _reason_code NOT IN ('member_request', 'verification_expired', 'steward_review', 'admin_correction') THEN
      RAISE EXCEPTION 'unsupported revocation reason' USING ERRCODE = '22023';
    END IF;

    UPDATE private.locality_memberships
    SET status = 'revoked',
        verified_by = NULL,
        verified_at = NULL,
        updated_at = pg_catalog.clock_timestamp()
    WHERE user_id = _user_id
      AND place_id = _place_id
      AND status = 'verified'
    RETURNING id, status INTO v_membership_id, v_status;

    IF v_membership_id IS NULL THEN
      RAISE EXCEPTION 'no current verified locality membership found';
    END IF;

    v_method := NULL;
    v_evidence := NULL;
  ELSE
    RAISE EXCEPTION 'action must be grant or revoke' USING ERRCODE = '22023';
  END IF;

  -- The membership mutation and audit write commit or roll back together.
  INSERT INTO private.locality_membership_events (
    membership_id,
    actor_user_id,
    subject_user_id,
    place_id,
    action,
    reason_code,
    verification_method,
    evidence_reference
  )
  VALUES (
    v_membership_id,
    _actor_id,
    _user_id,
    _place_id,
    _action,
    _reason_code,
    v_method,
    v_evidence
  )
  RETURNING id INTO v_event_id;

  RETURN QUERY SELECT v_membership_id, v_status, v_event_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.review_locality_membership(text, uuid, uuid, uuid, text, text, text)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.review_locality_membership(text, uuid, uuid, uuid, text, text, text)
  TO service_role;
