begin;

select plan(7);

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

select * from finish();

rollback;
