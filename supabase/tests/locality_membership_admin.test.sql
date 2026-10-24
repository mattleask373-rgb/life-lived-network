BEGIN;
SELECT plan(23);

-- Synthetic admin and subject accounts only; the transaction rolls back.
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data
) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'membership-admin@example.test', '',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'membership-target@example.test', '',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}');

INSERT INTO public.user_roles (user_id, role)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'admin');

INSERT INTO public.places (id, kind, name, slug, country_code, parent_id)
VALUES ('10000000-0000-4000-8000-000000000001', 'village', 'Provisioning Test Place',
        'membership-provisioning-test', 'GB', NULL);

SELECT ok(
  NOT has_function_privilege('anon',
    'public.review_locality_membership(text,uuid,uuid,uuid,text,text,text)', 'EXECUTE'),
  'anonymous role cannot invoke membership provisioning RPC'
);
SELECT ok(
  NOT has_function_privilege('authenticated',
    'public.review_locality_membership(text,uuid,uuid,uuid,text,text,text)', 'EXECUTE'),
  'authenticated role cannot invoke membership provisioning RPC directly'
);
SELECT ok(
  has_function_privilege('service_role',
    'public.review_locality_membership(text,uuid,uuid,uuid,text,text,text)', 'EXECUTE'),
  'server service role can invoke the guarded membership RPC'
);
SELECT ok(
  NOT has_table_privilege('anon', 'private.locality_membership_events', 'SELECT')
    AND NOT has_table_privilege('authenticated', 'private.locality_membership_events', 'SELECT')
    AND NOT has_table_privilege('service_role', 'private.locality_membership_events', 'SELECT'),
  'clients and service role cannot directly read the audit trail'
);
SELECT ok(
  NOT has_table_privilege('anon', 'private.locality_membership_events', 'INSERT')
    AND NOT has_table_privilege('authenticated', 'private.locality_membership_events', 'INSERT')
    AND NOT has_table_privilege('service_role', 'private.locality_membership_events', 'INSERT'),
  'only the security-definer RPC owner can append audit rows'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc AS function_record
    JOIN pg_catalog.pg_namespace AS namespace_record
      ON namespace_record.oid = function_record.pronamespace
    WHERE namespace_record.nspname = 'public'
      AND function_record.proname = 'review_locality_membership'
      AND function_record.prosecdef
      AND EXISTS (
        SELECT 1
        FROM pg_catalog.unnest(function_record.proconfig) AS config(setting)
        WHERE config.setting LIKE 'search_path=%'
          AND pg_catalog.replace(config.setting, 'search_path=', '') IN ('', '""')
      )
  ),
  'membership RPC is SECURITY DEFINER with an empty search_path'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS relation_record
    JOIN pg_catalog.pg_namespace AS namespace_record
      ON namespace_record.oid = relation_record.relnamespace
    WHERE namespace_record.nspname = 'private'
      AND relation_record.relname = 'locality_membership_events'
      AND relation_record.relrowsecurity
  ),
  'membership audit table has row-level security enabled'
);

SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role', 'service_role', true);
SELECT set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);

SELECT is(
  (SELECT membership_status FROM public.review_locality_membership(
    'grant',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '10000000-0000-4000-8000-000000000001',
    'local_steward',
    'case:steward-2026-001',
    'local_steward_attestation'
  )),
  'verified',
  'authorized admin grant returns verified status'
);

RESET ROLE;

SELECT is(
  (SELECT status FROM private.locality_memberships
   WHERE user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
     AND place_id = '10000000-0000-4000-8000-000000000001'),
  'verified',
  'grant writes a verified membership'
);
SELECT is(
  (SELECT verified_by FROM private.locality_memberships
   WHERE user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
     AND place_id = '10000000-0000-4000-8000-000000000001'),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'membership records the authenticated administrator as verifier'
);
SELECT ok(
  (SELECT expires_at > now() + interval '179 days'
   FROM private.locality_memberships
   WHERE user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
     AND place_id = '10000000-0000-4000-8000-000000000001'),
  'administrator grant sets a fresh 180-day membership expiry'
);
UPDATE private.locality_memberships
SET expires_at = now() - interval '1 second'
WHERE user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  AND place_id = '10000000-0000-4000-8000-000000000001';

SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role', 'service_role', true);
SELECT is(
  (SELECT membership_status FROM public.review_locality_membership(
    'grant',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '10000000-0000-4000-8000-000000000001',
    'local_steward',
    'case:steward-2026-002',
    'local_steward_attestation'
  )),
  'verified',
  'administrator grant can renew an expired membership'
);
RESET ROLE;

SELECT ok(
  (SELECT expires_at > now() + interval '179 days'
   FROM private.locality_memberships
   WHERE user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
     AND place_id = '10000000-0000-4000-8000-000000000001'),
  'renewal restores a fresh 180-day authorization window'
);
SELECT is(
  (SELECT count(*) FROM private.locality_membership_events
   WHERE action = 'grant'
     AND actor_user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     AND subject_user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
     AND place_id = '10000000-0000-4000-8000-000000000001'
     AND reason_code = 'local_steward_attestation'
     AND verification_method = 'local_steward'
     AND evidence_reference = 'case:steward-2026-001'),
  1::bigint,
  'grant and its reason/evidence reference are atomically audited'
);

SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role', 'service_role', true);
SELECT throws_ok(
  $$ SELECT * FROM public.review_locality_membership(
    'grant',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '10000000-0000-4000-8000-000000000001',
    'local_steward',
    'case:fake-admin',
    'local_steward_attestation'
  ); $$,
  '42501',
  'actor must be a current administrator',
  'service role cannot grant for a non-admin actor'
);
SELECT throws_ok(
  $$ SELECT * FROM public.review_locality_membership(
    'grant',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '10000000-0000-4000-8000-000000000001',
    'local_steward',
    'case:self-approval',
    'local_steward_attestation'
  ); $$,
  '42501',
  'administrators cannot approve or revoke their own locality membership',
  'admin cannot self-approve locality membership'
);
SELECT throws_ok(
  $$ SELECT * FROM public.review_locality_membership(
    'grant',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '10000000-0000-4000-8000-000000000001',
    NULL,
    'case:missing-method',
    'local_steward_attestation'
  ); $$,
  '22023',
  'verification method is required',
  'grant without a verification method is rejected before writing'
);
SELECT throws_ok(
  $$ SELECT * FROM public.review_locality_membership(
    'grant',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '10000000-0000-4000-8000-000000000001',
    'local_steward',
    'case:https://example.test/evidence',
    'local_steward_attestation'
  ); $$,
  '22023',
  'a short opaque evidence reference is required',
  'URL-based evidence references are rejected before writing'
);
-- The service role is intentionally denied direct audit-table reads.
-- Inspect the audit result as the disposable test owner, then return to the
-- service-role context to exercise the RPC's revoke boundary.
RESET ROLE;
SELECT is(
  (SELECT count(*) FROM private.locality_membership_events WHERE action = 'grant'),
  2::bigint,
  'rejected malformed grants do not create audit events'
);

SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role', 'service_role', true);
SELECT is(
  (SELECT membership_status FROM public.review_locality_membership(
    'revoke',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '10000000-0000-4000-8000-000000000001',
    NULL,
    NULL,
    'member_request'
  )),
  'revoked',
  'authorized admin revoke returns revoked status'
);
RESET ROLE;

SELECT ok(
  EXISTS (
    SELECT 1 FROM private.locality_memberships
    WHERE user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
      AND place_id = '10000000-0000-4000-8000-000000000001'
      AND status = 'revoked'
      AND verified_by IS NULL
      AND verified_at IS NULL
  ),
  'revocation immediately clears verified membership evidence'
);
SELECT is(
  (SELECT count(*) FROM private.locality_membership_events
   WHERE action = 'revoke'
     AND actor_user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     AND subject_user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
     AND reason_code = 'member_request'
     AND verification_method IS NULL
     AND evidence_reference IS NULL),
  1::bigint,
  'revocation is audit logged with controlled reason code'
);

SET LOCAL ROLE service_role;
SELECT set_config('request.jwt.claim.role', 'service_role', true);
SELECT throws_ok(
  $$ SELECT * FROM public.review_locality_membership(
    'revoke',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '10000000-0000-4000-8000-000000000001',
    NULL,
    NULL,
    'member_request'
  ); $$,
  'P0001',
  'no current verified locality membership found',
  'repeated revoke fails closed without creating a misleading success'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
