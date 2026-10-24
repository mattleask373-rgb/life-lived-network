BEGIN;
SELECT plan(18);

-- All fixture rows are synthetic, and the transaction rolls back every change.
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'atlas-locality-owner@example.test', '',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'atlas-locality-a@example.test', '',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'atlas-locality-b@example.test', '',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'atlas-locality-child@example.test', '',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'atlas-locality-no-grant@example.test', '',
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}');

INSERT INTO public.places (id, kind, name, slug, country_code, parent_id)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'city', 'Test Locality A', 'test-locality-a', 'GB', NULL),
  ('10000000-0000-4000-8000-000000000002', 'village', 'Test Village A1', 'test-village-a1', 'GB',
   '10000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000003', 'city', 'Test Locality B', 'test-locality-b', 'GB', NULL),
  ('10000000-0000-4000-8000-000000000004', 'city', 'Test Locality D', 'test-locality-d', 'GB', NULL);

-- auth.users' on_auth_user_created trigger inserts profile rows in this migration lineage.
-- Set the synthetic user's initial locality without colliding with that trigger-created row.
UPDATE public.profiles
SET place_id = '10000000-0000-4000-8000-000000000001',
    discoverable = true
WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
UPDATE public.profiles
SET place_id = '10000000-0000-4000-8000-000000000001',
    discoverable = true
WHERE id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

INSERT INTO public.needs (id, creator_id, category, title, status, visibility, place_id, place_text)
VALUES
  ('20000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'practical', 'Need in locality A', 'open', 'local_discovery',
   '10000000-0000-4000-8000-000000000001', 'Test Locality A'),
  ('20000000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'practical', 'Need in village A1', 'open', 'local_discovery',
   '10000000-0000-4000-8000-000000000002', 'Test Village A1'),
  ('20000000-0000-4000-8000-000000000003', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'practical', 'Need in locality B', 'open', 'local_discovery',
   '10000000-0000-4000-8000-000000000003', 'Test Locality B');

INSERT INTO public.needs (
  id, creator_id, category, title, status, visibility, place_id, place_text,
  last_confirmed_at, expires_at, ends_at
) VALUES
  ('20000000-0000-4000-8000-000000000004', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'practical', 'Public need in locality A', 'open', 'public',
   '10000000-0000-4000-8000-000000000001', 'Test Locality A', now(), NULL, NULL),
  ('20000000-0000-4000-8000-000000000005', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'practical', 'Stale local need in locality A', 'open', 'local_discovery',
   '10000000-0000-4000-8000-000000000001', 'Test Locality A',
   now() - interval '31 days', NULL, NULL),
  ('20000000-0000-4000-8000-000000000006', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'practical', 'Expired local need in locality A', 'open', 'local_discovery',
   '10000000-0000-4000-8000-000000000001', 'Test Locality A',
   now(), now() - interval '1 hour', NULL),
  ('20000000-0000-4000-8000-000000000007', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
   'practical', 'Creator-owned local need without membership', 'open', 'local_discovery',
   '10000000-0000-4000-8000-000000000004', 'Test Locality D',
   now(), NULL, NULL);

INSERT INTO private.locality_memberships
  (user_id, place_id, status, verified_by, verified_at)
VALUES
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '10000000-0000-4000-8000-000000000001',
   'verified', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now()),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '10000000-0000-4000-8000-000000000003',
   'verified', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now()),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '10000000-0000-4000-8000-000000000002',
   'verified', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now());

CREATE TEMP TABLE locality_probe_results (
  label text PRIMARY KEY,
  visible_count integer NOT NULL
) ON COMMIT DROP;

GRANT INSERT ON TABLE pg_temp.locality_probe_results TO anon, authenticated;

-- Anonymous PostgREST table/API reads cannot see local_discovery rows.
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
INSERT INTO pg_temp.locality_probe_results
SELECT 'anon_all_local', count(*)::integer
FROM public.needs
WHERE visibility = 'local_discovery';
INSERT INTO pg_temp.locality_probe_results
SELECT 'anon_public', count(*)::integer
FROM public.needs
WHERE visibility = 'public';
RESET ROLE;

-- Each membership authorizes its exact place only; parent/child inheritance is denied by default.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
INSERT INTO pg_temp.locality_probe_results
SELECT 'user_a_all_local', count(*)::integer
FROM public.needs
WHERE visibility = 'local_discovery';
INSERT INTO pg_temp.locality_probe_results
SELECT 'user_a_cross_locality_b', count(*)::integer
FROM public.needs
WHERE visibility = 'local_discovery'
  AND place_id = '10000000-0000-4000-8000-000000000003';
INSERT INTO pg_temp.locality_probe_results
SELECT 'user_a_cross_locality_child', count(*)::integer
FROM public.needs
WHERE visibility = 'local_discovery'
  AND place_id = '10000000-0000-4000-8000-000000000002';
INSERT INTO pg_temp.locality_probe_results
SELECT 'user_a_stale_locality_a', count(*)::integer
FROM public.needs
WHERE id = '20000000-0000-4000-8000-000000000005';
INSERT INTO pg_temp.locality_probe_results
SELECT 'user_a_expired_locality_a', count(*)::integer
FROM public.needs
WHERE id = '20000000-0000-4000-8000-000000000006';

-- An editable profile locality is not a trust or membership credential.
UPDATE public.profiles
SET place_id = '10000000-0000-4000-8000-000000000003'
WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
INSERT INTO pg_temp.locality_probe_results
SELECT 'user_a_after_profile_spoof', count(*)::integer
FROM public.needs
WHERE visibility = 'local_discovery';
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true);
INSERT INTO pg_temp.locality_probe_results
SELECT 'user_b_all_local', count(*)::integer
FROM public.needs
WHERE visibility = 'local_discovery';
INSERT INTO pg_temp.locality_probe_results
SELECT 'user_b_cross_locality_a', count(*)::integer
FROM public.needs
WHERE visibility = 'local_discovery'
  AND place_id IN (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002'
  );
RESET ROLE;

-- A self-reported profile locality without a verified membership grants no access.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', true);
INSERT INTO pg_temp.locality_probe_results
SELECT 'user_no_grant_same_profile', count(*)::integer
FROM public.needs
WHERE visibility = 'local_discovery';
RESET ROLE;

-- Village-only membership does not grant access to its parent locality or sibling places.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', true);
INSERT INTO pg_temp.locality_probe_results
SELECT 'village_member_all_local', count(*)::integer
FROM public.needs
WHERE visibility = 'local_discovery';
INSERT INTO pg_temp.locality_probe_results
SELECT 'village_member_parent_place', count(*)::integer
FROM public.needs
WHERE visibility = 'local_discovery'
  AND place_id = '10000000-0000-4000-8000-000000000001';
RESET ROLE;

SELECT is((SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'anon_all_local'),
  0, 'anonymous requests cannot read local_discovery needs');
SELECT is((SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'anon_public'),
  1, 'anonymous requests retain access to open fresh public needs');
SELECT is((SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'user_a_all_local'),
  1, 'verified locality A member can read only the exact locality granted');
SELECT is((SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'user_a_cross_locality_child'),
  0, 'parent locality membership does not implicitly grant descendant-place access');
SELECT is((SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'user_a_stale_locality_a'),
  0, 'stale local-discovery needs remain hidden despite matching locality');
SELECT is((SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'user_a_expired_locality_a'),
  0, 'expired local-discovery needs remain hidden despite matching locality');
SELECT is((SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'user_a_cross_locality_b'),
  0, 'locality A member cannot read locality B needs');
SELECT is((SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'user_a_after_profile_spoof'),
  1, 'changing profile.place_id does not grant cross-locality access');
SELECT is((SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'user_b_all_local'),
  1, 'verified locality B member sees locality B needs only');
SELECT is((SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'user_b_cross_locality_a'),
  0, 'locality B member cannot read locality A or its child-village needs');
SELECT is((SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'user_no_grant_same_profile'),
  0, 'a non-member cannot read local_discovery rows even when they created one or spoof their profile place');
SELECT is((SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'village_member_all_local'),
  1, 'verified village member sees needs in that village only');
SELECT is((SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'village_member_parent_place'),
  0, 'village member cannot read needs attached to the parent locality');
SELECT ok(
  NOT has_function_privilege('anon', 'private.is_verified_locality_member(uuid)', 'EXECUTE'),
  'anonymous role cannot invoke the locality authorization helper'
);
SELECT ok(
  NOT has_table_privilege('anon', 'private.locality_memberships', 'SELECT')
  AND NOT has_table_privilege('anon', 'private.locality_memberships', 'INSERT')
  AND NOT has_table_privilege('anon', 'private.locality_memberships', 'UPDATE')
  AND NOT has_table_privilege('anon', 'private.locality_memberships', 'DELETE')
  AND NOT has_table_privilege('authenticated', 'private.locality_memberships', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'private.locality_memberships', 'INSERT')
  AND NOT has_table_privilege('authenticated', 'private.locality_memberships', 'UPDATE')
  AND NOT has_table_privilege('authenticated', 'private.locality_memberships', 'DELETE'),
  'membership and verification records are not directly readable by client roles'
);
SELECT ok(
  NOT has_table_privilege('service_role', 'private.locality_memberships', 'SELECT')
  AND NOT has_table_privilege('service_role', 'private.locality_memberships', 'INSERT')
  AND NOT has_table_privilege('service_role', 'private.locality_memberships', 'UPDATE')
  AND NOT has_table_privilege('service_role', 'private.locality_memberships', 'DELETE'),
  'service role must use the narrow SECURITY DEFINER RPC, not direct membership-table access'
);

-- Deleting the account that verified membership revokes those grants instead
-- of blocking deletion or leaving an active membership without a verifier.
DELETE FROM auth.users
WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

SELECT is(
  (SELECT count(*) FROM private.locality_memberships
   WHERE user_id IN (
     'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
     'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
     'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
   )
     AND status = 'revoked'
     AND verified_by IS NULL
     AND verified_at IS NULL),
  3::bigint,
  'deleting a verifier revokes all memberships they verified'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
INSERT INTO pg_temp.locality_probe_results
SELECT 'user_a_after_verifier_deletion', count(*)::integer
FROM public.needs
WHERE visibility = 'local_discovery';
RESET ROLE;

SELECT is(
  (SELECT visible_count FROM pg_temp.locality_probe_results WHERE label = 'user_a_after_verifier_deletion'),
  0,
  'a membership loses access as soon as its verifier account is deleted'
);

SELECT * FROM finish();
ROLLBACK;
