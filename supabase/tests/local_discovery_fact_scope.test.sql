BEGIN;

SELECT plan(90);

-- All users, places and facts are synthetic; the transaction rolls back.

INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data) VALUES

  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-fact-scope@example.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'readerA-fact-scope@example.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('33333333-3333-4333-8333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'readerB-fact-scope@example.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('44444444-4444-4444-8444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'readerChild-fact-scope@example.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('55555555-5555-4555-8555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'noGrant-fact-scope@example.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('66666666-6666-4666-8666-666666666666', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'providerA-fact-scope@example.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('77777777-7777-4777-8777-777777777777', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'providerB-fact-scope@example.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('88888888-8888-4888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'providerChild-fact-scope@example.test', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}');

INSERT INTO public.places (id, kind, name, slug, country_code, parent_id) VALUES
 ('31000000-0000-4000-8000-000000000001','city','Fact Test A','fact-test-a','GB',NULL),
 ('31000000-0000-4000-8000-000000000002','village','Fact Test Child','fact-test-child','GB','31000000-0000-4000-8000-000000000001'),
 ('31000000-0000-4000-8000-000000000003','city','Fact Test B','fact-test-b','GB',NULL);

UPDATE public.profiles SET place_id='31000000-0000-4000-8000-000000000001',discoverable=true WHERE id IN ('66666666-6666-4666-8666-666666666666','55555555-5555-4555-8555-555555555555');
UPDATE public.profiles SET place_id='31000000-0000-4000-8000-000000000002',discoverable=true WHERE id='88888888-8888-4888-8888-888888888888';
UPDATE public.profiles SET place_id='31000000-0000-4000-8000-000000000003',discoverable=true WHERE id='77777777-7777-4777-8777-777777777777';

INSERT INTO private.locality_memberships (user_id,place_id,status,verified_by,verified_at) VALUES
 ('22222222-2222-4222-8222-222222222222','31000000-0000-4000-8000-000000000001','verified','11111111-1111-4111-8111-111111111111',now()),
 ('33333333-3333-4333-8333-333333333333','31000000-0000-4000-8000-000000000003','verified','11111111-1111-4111-8111-111111111111',now()),
 ('44444444-4444-4444-8444-444444444444','31000000-0000-4000-8000-000000000002','verified','11111111-1111-4111-8111-111111111111',now());

INSERT INTO public.person_capabilities (id,user_id,kind,label,visibility,expires_on,last_confirmed_at) VALUES
 ('41000000-0000-4000-8000-000000000001','66666666-6666-4666-8666-666666666666','skill','public A capability','public',NULL,now()),
 ('41000000-0000-4000-8000-000000000002','66666666-6666-4666-8666-666666666666','skill','local A capability','local_discovery',NULL,now()),
 ('41000000-0000-4000-8000-000000000003','88888888-8888-4888-8888-888888888888','skill','child capability','local_discovery',NULL,now()),
 ('41000000-0000-4000-8000-000000000004','77777777-7777-4777-8777-777777777777','skill','local B capability','local_discovery',NULL,now()),
 ('41000000-0000-4000-8000-000000000005','66666666-6666-4666-8666-666666666666','skill','private A capability','private',NULL,now()),
 ('41000000-0000-4000-8000-000000000006','66666666-6666-4666-8666-666666666666','experience','stale A capability','local_discovery',NULL,now()-interval '31 days'),
 ('41000000-0000-4000-8000-000000000007','66666666-6666-4666-8666-666666666666','qualification','expired A capability','local_discovery',CURRENT_DATE-1,now());

INSERT INTO public.service_areas (id,user_id,place_id,radius_km,note,visibility,relation,travel_willingness) VALUES
 ('42000000-0000-4000-8000-000000000001','66666666-6666-4666-8666-666666666666','31000000-0000-4000-8000-000000000001',10,'','public','serves','local'),
 ('42000000-0000-4000-8000-000000000002','66666666-6666-4666-8666-666666666666','31000000-0000-4000-8000-000000000001',10,'','local_discovery','serves','local'),
 ('42000000-0000-4000-8000-000000000003','88888888-8888-4888-8888-888888888888','31000000-0000-4000-8000-000000000002',10,'','local_discovery','serves','local'),
 ('42000000-0000-4000-8000-000000000004','77777777-7777-4777-8777-777777777777','31000000-0000-4000-8000-000000000003',10,'','local_discovery','serves','local'),
 ('42000000-0000-4000-8000-000000000005','66666666-6666-4666-8666-666666666666','31000000-0000-4000-8000-000000000003',10,'','local_discovery','serves','local'),
 ('42000000-0000-4000-8000-000000000006','66666666-6666-4666-8666-666666666666','31000000-0000-4000-8000-000000000001',10,'','private','serves','local');

INSERT INTO public.availability_windows (id,user_id,starts_at,ends_at,timezone,recurrence,note,visibility,expires_at,last_confirmed_at) VALUES
 ('43000000-0000-4000-8000-000000000001','66666666-6666-4666-8666-666666666666',now()+interval '1 hour',now()+interval '2 hours','UTC','none','','public',NULL,now()),
 ('43000000-0000-4000-8000-000000000002','66666666-6666-4666-8666-666666666666',now()+interval '1 hour',now()+interval '2 hours','UTC','none','','local_discovery',NULL,now()),
 ('43000000-0000-4000-8000-000000000003','88888888-8888-4888-8888-888888888888',now()+interval '1 hour',now()+interval '2 hours','UTC','none','','local_discovery',NULL,now()),
 ('43000000-0000-4000-8000-000000000004','77777777-7777-4777-8777-777777777777',now()+interval '1 hour',now()+interval '2 hours','UTC','none','','local_discovery',NULL,now()),
 ('43000000-0000-4000-8000-000000000005','66666666-6666-4666-8666-666666666666',now()+interval '1 hour',now()+interval '2 hours','UTC','none','','private',NULL,now()),
 ('43000000-0000-4000-8000-000000000006','66666666-6666-4666-8666-666666666666',now()+interval '1 hour',now()+interval '2 hours','UTC','none','','local_discovery',NULL,now()-interval '31 days'),
 ('43000000-0000-4000-8000-000000000007','66666666-6666-4666-8666-666666666666',now()+interval '1 hour',now()+interval '2 hours','UTC','none','','local_discovery',now()-interval '1 hour',now());

INSERT INTO public.opportunity_preferences (id,user_id,preference,note,visibility,earning_preference) VALUES
 ('44000000-0000-4000-8000-000000000001','66666666-6666-4666-8666-666666666666','public opp preference','','public','unstated'),
 ('44000000-0000-4000-8000-000000000002','66666666-6666-4666-8666-666666666666','local A opp preference','','local_discovery','unstated'),
 ('44000000-0000-4000-8000-000000000003','88888888-8888-4888-8888-888888888888','child opp preference','','local_discovery','unstated'),
 ('44000000-0000-4000-8000-000000000004','77777777-7777-4777-8777-777777777777','local B opp preference','','local_discovery','unstated'),
 ('44000000-0000-4000-8000-000000000005','66666666-6666-4666-8666-666666666666','private A opp preference','','private','unstated');

INSERT INTO public.contribution_preferences (id,user_id,contribution,note,visibility) VALUES
 ('45000000-0000-4000-8000-000000000001','66666666-6666-4666-8666-666666666666','public contribution','','public'),
 ('45000000-0000-4000-8000-000000000002','66666666-6666-4666-8666-666666666666','local A contribution','','local_discovery'),
 ('45000000-0000-4000-8000-000000000003','88888888-8888-4888-8888-888888888888','child contribution','','local_discovery'),
 ('45000000-0000-4000-8000-000000000004','77777777-7777-4777-8777-777777777777','local B contribution','','local_discovery'),
 ('45000000-0000-4000-8000-000000000005','66666666-6666-4666-8666-666666666666','private A contribution','','private');

CREATE TEMP TABLE fact_policy_probe (label text PRIMARY KEY, visible_count integer NOT NULL) ON COMMIT DROP;

GRANT INSERT ON TABLE pg_temp.fact_policy_probe TO anon, authenticated;

SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub', '', true);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_cap_local_all', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000002'::uuid, '41000000-0000-4000-8000-000000000003'::uuid, '41000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_cap_public', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_cap_private', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_area_local_all', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000002'::uuid, '42000000-0000-4000-8000-000000000003'::uuid, '42000000-0000-4000-8000-000000000004'::uuid, '42000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_area_public', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_area_private', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000006'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_avail_local_all', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000002'::uuid, '43000000-0000-4000-8000-000000000003'::uuid, '43000000-0000-4000-8000-000000000004'::uuid, '43000000-0000-4000-8000-000000000006'::uuid, '43000000-0000-4000-8000-000000000007'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_avail_public', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_avail_private', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_opp_local_all', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000002'::uuid, '44000000-0000-4000-8000-000000000003'::uuid, '44000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_opp_public', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_opp_private', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_contribution_local_all', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000002'::uuid, '45000000-0000-4000-8000-000000000003'::uuid, '45000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_contribution_public', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'anon_contribution_private', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000005'::uuid);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_cap_local_a', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000002'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_cap_cross', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000003'::uuid, '41000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_cap_private', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_cap_public', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_area_local_a', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000002'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_area_cross', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000003'::uuid, '42000000-0000-4000-8000-000000000004'::uuid, '42000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_area_private', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000006'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_area_public', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_avail_local_a', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000002'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_avail_cross', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000003'::uuid, '43000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_avail_private', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_avail_public', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_opp_local_a', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000002'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_opp_cross', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000003'::uuid, '44000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_opp_private', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_opp_public', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_contribution_local_a', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000002'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_contribution_cross', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000003'::uuid, '45000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_contribution_private', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_contribution_public', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_cap_stale', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000006'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_cap_expired', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000007'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_avail_stale', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000006'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_a_avail_expired', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000007'::uuid);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_cap_local_b', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_cap_cross', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000002'::uuid, '41000000-0000-4000-8000-000000000003'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_cap_private', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_cap_public', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_area_local_b', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_area_cross', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000002'::uuid, '42000000-0000-4000-8000-000000000003'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_area_private', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000006'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_area_public', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_avail_local_b', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_avail_cross', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000002'::uuid, '43000000-0000-4000-8000-000000000003'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_avail_private', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_avail_public', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_opp_local_b', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_opp_cross', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000002'::uuid, '44000000-0000-4000-8000-000000000003'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_opp_private', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_opp_public', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_contribution_local_b', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_contribution_cross', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000002'::uuid, '45000000-0000-4000-8000-000000000003'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_contribution_private', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_contribution_public', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_b_area_target_place', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000005'::uuid);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_cap_local_child', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000003'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_cap_cross', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000002'::uuid, '41000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_cap_private', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_cap_public', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_area_local_child', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000003'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_area_cross', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000002'::uuid, '42000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_area_private', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000006'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_area_public', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_avail_local_child', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000003'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_avail_cross', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000002'::uuid, '43000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_avail_private', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_avail_public', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_opp_local_child', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000003'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_opp_cross', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000002'::uuid, '44000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_opp_private', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_opp_public', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000001'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_contribution_local_child', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000003'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_contribution_cross', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000002'::uuid, '45000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_contribution_private', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'reader_child_contribution_public', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000001'::uuid);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'no_grant_cap_local_all', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000002'::uuid, '41000000-0000-4000-8000-000000000003'::uuid, '41000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'no_grant_area_local_all', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000002'::uuid, '42000000-0000-4000-8000-000000000003'::uuid, '42000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'no_grant_avail_local_all', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000002'::uuid, '43000000-0000-4000-8000-000000000003'::uuid, '43000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'no_grant_opp_local_all', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000002'::uuid, '44000000-0000-4000-8000-000000000003'::uuid, '44000000-0000-4000-8000-000000000004'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'no_grant_contribution_local_all', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000002'::uuid, '45000000-0000-4000-8000-000000000003'::uuid, '45000000-0000-4000-8000-000000000004'::uuid);
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '66666666-6666-4666-8666-666666666666', true);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'provider_a_cap_private_own', count(*)::integer FROM public.person_capabilities WHERE id IN ('41000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'provider_a_area_private_own', count(*)::integer FROM public.service_areas WHERE id IN ('42000000-0000-4000-8000-000000000006'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'provider_a_avail_private_own', count(*)::integer FROM public.availability_windows WHERE id IN ('43000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'provider_a_opp_private_own', count(*)::integer FROM public.opportunity_preferences WHERE id IN ('44000000-0000-4000-8000-000000000005'::uuid);
INSERT INTO pg_temp.fact_policy_probe(label, visible_count) SELECT 'provider_a_contribution_private_own', count(*)::integer FROM public.contribution_preferences WHERE id IN ('45000000-0000-4000-8000-000000000005'::uuid);
RESET ROLE;

SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_cap_local_all'),0,'anonymous requests cannot read local-discovery person_capabilities facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_cap_public'),1,'anonymous requests can read explicitly public person_capabilities facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_cap_private'),0,'anonymous requests cannot read private person_capabilities facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_area_local_all'),0,'anonymous requests cannot read local-discovery service_areas facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_area_public'),1,'anonymous requests can read explicitly public service_areas facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_area_private'),0,'anonymous requests cannot read private service_areas facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_avail_local_all'),0,'anonymous requests cannot read local-discovery availability_windows facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_avail_public'),1,'anonymous requests can read explicitly public availability_windows facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_avail_private'),0,'anonymous requests cannot read private availability_windows facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_opp_local_all'),0,'anonymous requests cannot read local-discovery opportunity_preferences facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_opp_public'),1,'anonymous requests can read explicitly public opportunity_preferences facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_opp_private'),0,'anonymous requests cannot read private opportunity_preferences facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_contribution_local_all'),0,'anonymous requests cannot read local-discovery contribution_preferences facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_contribution_public'),1,'anonymous requests can read explicitly public contribution_preferences facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='anon_contribution_private'),0,'anonymous requests cannot read private contribution_preferences facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_cap_local_a'),1,'verified locality A member can read exact A person_capabilities fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_cap_cross'),0,'locality A member cannot read child or B person_capabilities facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_cap_private'),0,'locality A member cannot read another person''s private person_capabilities fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_cap_public'),1,'verified locality A member retains global public person_capabilities read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_area_local_a'),1,'verified locality A member can read exact A service_areas fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_area_cross'),0,'locality A member cannot read child or B service_areas facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_area_private'),0,'locality A member cannot read another person''s private service_areas fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_area_public'),1,'verified locality A member retains global public service_areas read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_avail_local_a'),1,'verified locality A member can read exact A availability_windows fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_avail_cross'),0,'locality A member cannot read child or B availability_windows facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_avail_private'),0,'locality A member cannot read another person''s private availability_windows fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_avail_public'),1,'verified locality A member retains global public availability_windows read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_opp_local_a'),1,'verified locality A member can read exact A opportunity_preferences fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_opp_cross'),0,'locality A member cannot read child or B opportunity_preferences facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_opp_private'),0,'locality A member cannot read another person''s private opportunity_preferences fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_opp_public'),1,'verified locality A member retains global public opportunity_preferences read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_contribution_local_a'),1,'verified locality A member can read exact A contribution_preferences fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_contribution_cross'),0,'locality A member cannot read child or B contribution_preferences facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_contribution_private'),0,'locality A member cannot read another person''s private contribution_preferences fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_contribution_public'),1,'verified locality A member retains global public contribution_preferences read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_cap_stale'),0,'stale capability hidden by RLS');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_cap_expired'),0,'expired capability hidden by RLS');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_avail_stale'),0,'stale availability hidden by RLS');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_a_avail_expired'),0,'expired availability hidden by RLS');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_cap_local_b'),1,'verified locality B member can read exact B person_capabilities fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_cap_cross'),0,'locality B member cannot read A or child person_capabilities facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_cap_private'),0,'locality B member cannot read another person''s private person_capabilities fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_cap_public'),1,'verified locality B member retains global public person_capabilities read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_area_local_b'),1,'verified locality B member can read exact B service_areas fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_area_cross'),0,'locality B member cannot read A or child service_areas facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_area_private'),0,'locality B member cannot read another person''s private service_areas fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_area_public'),1,'verified locality B member retains global public service_areas read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_avail_local_b'),1,'verified locality B member can read exact B availability_windows fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_avail_cross'),0,'locality B member cannot read A or child availability_windows facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_avail_private'),0,'locality B member cannot read another person''s private availability_windows fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_avail_public'),1,'verified locality B member retains global public availability_windows read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_opp_local_b'),1,'verified locality B member can read exact B opportunity_preferences fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_opp_cross'),0,'locality B member cannot read A or child opportunity_preferences facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_opp_private'),0,'locality B member cannot read another person''s private opportunity_preferences fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_opp_public'),1,'verified locality B member retains global public opportunity_preferences read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_contribution_local_b'),1,'verified locality B member can read exact B contribution_preferences fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_contribution_cross'),0,'locality B member cannot read A or child contribution_preferences facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_contribution_private'),0,'locality B member cannot read another person''s private contribution_preferences fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_contribution_public'),1,'verified locality B member retains global public contribution_preferences read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_b_area_target_place'),1,'service area scope follows place B even when provider profile place is A');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_cap_local_child'),1,'verified child member can read exact child person_capabilities fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_cap_cross'),0,'child member cannot read parent or B person_capabilities facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_cap_private'),0,'child member cannot read another person''s private person_capabilities fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_cap_public'),1,'child member retains global public person_capabilities read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_area_local_child'),1,'verified child member can read exact child service_areas fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_area_cross'),0,'child member cannot read parent or B service_areas facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_area_private'),0,'child member cannot read another person''s private service_areas fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_area_public'),1,'child member retains global public service_areas read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_avail_local_child'),1,'verified child member can read exact child availability_windows fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_avail_cross'),0,'child member cannot read parent or B availability_windows facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_avail_private'),0,'child member cannot read another person''s private availability_windows fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_avail_public'),1,'child member retains global public availability_windows read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_opp_local_child'),1,'verified child member can read exact child opportunity_preferences fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_opp_cross'),0,'child member cannot read parent or B opportunity_preferences facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_opp_private'),0,'child member cannot read another person''s private opportunity_preferences fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_opp_public'),1,'child member retains global public opportunity_preferences read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_contribution_local_child'),1,'verified child member can read exact child contribution_preferences fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_contribution_cross'),0,'child member cannot read parent or B contribution_preferences facts');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_contribution_private'),0,'child member cannot read another person''s private contribution_preferences fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='reader_child_contribution_public'),1,'child member retains global public contribution_preferences read access');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='no_grant_cap_local_all'),0,'profile locality alone grants no access to person_capabilities');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='no_grant_area_local_all'),0,'profile locality alone grants no access to service_areas');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='no_grant_avail_local_all'),0,'profile locality alone grants no access to availability_windows');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='no_grant_opp_local_all'),0,'profile locality alone grants no access to opportunity_preferences');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='no_grant_contribution_local_all'),0,'profile locality alone grants no access to contribution_preferences');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='provider_a_cap_private_own'),1,'owner can read own private person_capabilities fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='provider_a_area_private_own'),1,'owner can read own private service_areas fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='provider_a_avail_private_own'),1,'owner can read own private availability_windows fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='provider_a_opp_private_own'),1,'owner can read own private opportunity_preferences fact');
SELECT is((SELECT visible_count FROM pg_temp.fact_policy_probe WHERE label='provider_a_contribution_private_own'),1,'owner can read own private contribution_preferences fact');

SELECT * FROM finish();

ROLLBACK;