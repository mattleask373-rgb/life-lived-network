begin;

select plan(14);

-- Runtime authorization fixtures. All rows/users are rolled back at the end.
-- Use distinct fixed UUIDs so the test remains deterministic.
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaa0000-0000-4000-8000-000000000001', 'need-owner@test.local', '{"display_name":"Need Owner"}'),
  ('bbbb0000-0000-4000-8000-000000000002', 'need-outsider@test.local', '{"display_name":"Need Outsider"}');

insert into public.needs (
  id, creator_id, category, title, status, visibility,
  last_confirmed_at, expires_at, ends_at, place_text
) values
  ('11111111-1111-4111-8111-111111111111', 'aaaa0000-0000-4000-8000-000000000001',
   'practical', 'Fresh public need', 'open', 'public', now(), null, null, 'Bristol'),
  ('22222222-2222-4222-8222-222222222222', 'aaaa0000-0000-4000-8000-000000000001',
   'practical', 'Need to close', 'open', 'public', now(), null, null, 'Bristol'),
  ('33333333-3333-4333-8333-333333333333', 'aaaa0000-0000-4000-8000-000000000001',
   'practical', 'Stale public need', 'open', 'public', now() - interval '31 days', null, null, 'Bristol'),
  ('44444444-4444-4444-8444-444444444444', 'aaaa0000-0000-4000-8000-000000000001',
   'practical', 'Expired public need', 'open', 'public', now(), now() - interval '1 minute', null, 'Bristol'),
  ('55555555-5555-4555-8555-555555555555', 'aaaa0000-0000-4000-8000-000000000001',
   'practical', 'Private need', 'open', 'private', now(), null, null, 'Bristol'),
  ('66666666-6666-4666-8666-666666666666', 'aaaa0000-0000-4000-8000-000000000001',
   'practical', 'Closed public need', 'met', 'public', now(), null, null, 'Bristol');

CREATE TEMP TABLE lifecycle_probe_results (
  name text PRIMARY KEY,
  affected_rows bigint,
  error_code text,
  error_message text
) ON COMMIT DROP;
GRANT INSERT ON TABLE pg_temp.lifecycle_probe_results TO authenticated, anon;

select ok(
  (
    select c.relrowsecurity
    from pg_class AS c
    where c.oid = 'public.needs'::regclass
  ),
  'RLS remains enabled on needs'
);

select ok(
  exists (
    select 1
    from pg_policies AS p
    where p.schemaname = 'public'
      and p.tablename = 'needs'
      and p.policyname = 'Current public needs are readable by anyone'
      and lower(p.qual) like '%status%'
      and lower(p.qual) like '%visibility%'
      and lower(p.qual) like '%last_confirmed_at%'
      and lower(p.qual) like '%expires_at%'
      and lower(p.qual) like '%ends_at%'
  ),
  'public read policy requires open, public, current needs within the stated time window'
);

select ok(
  exists (
    select 1
    from pg_trigger AS t
    where t.tgrelid = 'public.needs'::regclass
      and t.tgname = 'needs_lifecycle_update_guard'
      and not t.tgisinternal
      and pg_get_triggerdef(t.oid) ilike '%guard_need_lifecycle_update%'
  ),
  'need lifecycle update guard is installed as a before-update trigger'
);

select ok(
  (
    select p.proconfig is not null
      and array_to_string(p.proconfig, ',') ilike '%search_path%'
    from pg_proc AS p
    where p.oid = to_regprocedure('private.guard_need_lifecycle_update()')
  ),
  'need lifecycle trigger function pins its search path'
);

select ok(
  not has_function_privilege('anon', 'private.guard_need_lifecycle_update()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'private.guard_need_lifecycle_update()', 'EXECUTE'),
  'clients cannot call the private need lifecycle trigger function directly'
);

select ok(
  to_regprocedure('private.guard_connection_request_insert()') is not null
  and pg_get_functiondef(
    to_regprocedure('private.guard_connection_request_insert()')
  ) ilike '%need_last_confirmed_at%'
  and pg_get_functiondef(
    to_regprocedure('private.guard_connection_request_insert()')
  ) ilike '%need_ends_at%',
  'connection insertion rechecks need freshness and explicit end time'
);

select ok(
  exists (
    select 1
    from pg_indexes AS i
    where i.schemaname = 'public'
      and i.tablename = 'needs'
      and i.indexname = 'needs_public_freshness_idx'
  ),
  'public freshness filter has a supporting partial index'
);

-- Execute as actual client roles. Capture outcomes in a transaction-local
-- table, then assert them as postgres so pgTAP helper permissions cannot mask
-- the access-control behavior being tested.
set local role authenticated;
set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-000000000001';

with changed as (
  update public.needs
     set last_confirmed_at = statement_timestamp()
   where id = '11111111-1111-4111-8111-111111111111'
   returning id
)
insert into pg_temp.lifecycle_probe_results(name, affected_rows)
select 'owner_reconfirm', count(*) from changed;

set local request.jwt.claim.sub = 'bbbb0000-0000-4000-8000-000000000002';

with changed as (
  update public.needs
     set status = 'met'
   where id = '11111111-1111-4111-8111-111111111111'
   returning id
)
insert into pg_temp.lifecycle_probe_results(name, affected_rows)
select 'non_owner_change', count(*) from changed;

set local request.jwt.claim.sub = 'aaaa0000-0000-4000-8000-000000000001';

with changed as (
  update public.needs
     set status = 'met'
   where id = '22222222-2222-4222-8222-222222222222'
   returning id
)
insert into pg_temp.lifecycle_probe_results(name, affected_rows)
select 'owner_close', count(*) from changed;

-- Catch the expected database error while still operating as the authenticated
-- role; assert its SQLSTATE and message only after resetting the role.
DO $closed_reopen$
DECLARE
  v_state text;
  v_message text;
  v_rows bigint;
BEGIN
  BEGIN
    UPDATE public.needs
       SET status = 'open'
     WHERE id = '22222222-2222-4222-8222-222222222222';
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    INSERT INTO pg_temp.lifecycle_probe_results(name, affected_rows)
    VALUES ('closed_reopen', v_rows);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_message = MESSAGE_TEXT;
    INSERT INTO pg_temp.lifecycle_probe_results(name, error_code, error_message)
    VALUES ('closed_reopen', v_state, v_message);
  END;
END;
$closed_reopen$;

DO $expired_reconfirm$
DECLARE
  v_state text;
  v_message text;
  v_rows bigint;
BEGIN
  BEGIN
    UPDATE public.needs
       SET last_confirmed_at = statement_timestamp()
     WHERE id = '44444444-4444-4444-8444-444444444444';
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    INSERT INTO pg_temp.lifecycle_probe_results(name, affected_rows)
    VALUES ('expired_reconfirm', v_rows);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_message = MESSAGE_TEXT;
    INSERT INTO pg_temp.lifecycle_probe_results(name, error_code, error_message)
    VALUES ('expired_reconfirm', v_state, v_message);
  END;
END;
$expired_reconfirm$;

reset role;

select is(
  (select affected_rows from pg_temp.lifecycle_probe_results where name = 'owner_reconfirm'),
  1::bigint,
  'owner can reconfirm an open, unexpired need'
);

select is(
  (select affected_rows from pg_temp.lifecycle_probe_results where name = 'non_owner_change'),
  0::bigint,
  'non-owner cannot change the need lifecycle'
);

select is(
  (select affected_rows from pg_temp.lifecycle_probe_results where name = 'owner_close'),
  1::bigint,
  'owner can mark an open need as met'
);

select is(
  (select error_code || ':' || error_message
     from pg_temp.lifecycle_probe_results where name = 'closed_reopen'),
  '42501:A closed need cannot be reopened',
  'closed needs cannot be reopened by direct authenticated updates'
);

select is(
  (select error_code || ':' || error_message
     from pg_temp.lifecycle_probe_results where name = 'expired_reconfirm'),
  '42501:A need whose stated time window has ended cannot be reconfirmed',
  'an expired need cannot be refreshed to become discoverable again'
);

set local role anon;

insert into pg_temp.lifecycle_probe_results(name, affected_rows)
select 'anonymous_visible', count(*)
from public.needs
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666'
);

reset role;

select is(
  (select affected_rows from pg_temp.lifecycle_probe_results where name = 'anonymous_visible'),
  1::bigint,
  'anonymous discovery returns only the fresh, open, public test need'
);

set local role authenticated;
set local request.jwt.claim.sub = 'bbbb0000-0000-4000-8000-000000000002';

DO $stale_connection$
DECLARE
  v_state text;
  v_message text;
  v_rows bigint;
BEGIN
  BEGIN
    INSERT INTO public.connection_requests (need_id, sender_id, recipient_id, direction, note)
    VALUES (
      '33333333-3333-4333-8333-333333333333',
      'bbbb0000-0000-4000-8000-000000000002',
      'aaaa0000-0000-4000-8000-000000000001',
      'offer',
      'Stale request probe'
    );
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    INSERT INTO pg_temp.lifecycle_probe_results(name, affected_rows)
    VALUES ('stale_connection', v_rows);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_state = RETURNED_SQLSTATE, v_message = MESSAGE_TEXT;
    INSERT INTO pg_temp.lifecycle_probe_results(name, error_code, error_message)
    VALUES ('stale_connection', v_state, v_message);
  END;
END;
$stale_connection$;

reset role;

select is(
  (select error_code || ':' || error_message
     from pg_temp.lifecycle_probe_results where name = 'stale_connection'),
  '42501:the referenced need is not available to this user',
  'stale demand cannot receive a direct connection request'
);

select * from finish();

rollback;
