begin;
select plan(9);

select ok(
  to_regclass('public.agent_events') is not null
  and to_regclass('public.agent_tasks') is not null
  and to_regclass('public.agent_task_completions') is not null
  and to_regclass('public.agent_execution_runs') is not null
  and to_regclass('public.agent_execution_attempts') is not null
  and to_regclass('public.agent_execution_audit') is not null,
  'all durable agent control-plane tables exist'
);

select ok(
  (
    select bool_and(c.relrowsecurity)
    from pg_class c
    where c.oid in (
      to_regclass('public.agent_events'),
      to_regclass('public.agent_tasks'),
      to_regclass('public.agent_task_completions'),
      to_regclass('public.agent_execution_runs'),
      to_regclass('public.agent_execution_attempts'),
      to_regclass('public.agent_execution_audit')
    )
  ),
  'row-level security is enabled on every control-plane table'
);

select ok(
  (
    select count(distinct p.tablename) = 6
    from pg_policies p
    where p.schemaname = 'public'
      and p.policyname in (
        'agent_events_no_client_access',
        'agent_tasks_no_client_access',
        'agent_task_completions_no_client_access',
        'agent_execution_runs_no_client_access',
        'agent_execution_attempts_no_client_access',
        'agent_execution_audit_no_client_access'
      )
  ),
  'every control-plane table has its explicit client-deny policy'
);

select ok(
  (
    select bool_and(
      not has_table_privilege(r.role_name, t.table_name, p.privilege)
    )
    from (values ('anon'), ('authenticated')) as r(role_name)
    cross join (values
      ('public.agent_events'),
      ('public.agent_tasks'),
      ('public.agent_task_completions'),
      ('public.agent_execution_runs'),
      ('public.agent_execution_attempts'),
      ('public.agent_execution_audit')
    ) as t(table_name)
    cross join (values
      ('SELECT'),
      ('INSERT'),
      ('UPDATE'),
      ('DELETE'),
      ('TRUNCATE'),
      ('REFERENCES'),
      ('TRIGGER')
    ) as p(privilege)
  ),
  'anon and authenticated have no direct table privileges on the control-plane schema'
);

select ok(
  (
    select bool_and(has_table_privilege('service_role', t.table_name, p.privilege))
    from (values
      ('public.agent_events'),
      ('public.agent_tasks'),
      ('public.agent_task_completions'),
      ('public.agent_execution_runs'),
      ('public.agent_execution_attempts'),
      ('public.agent_execution_audit')
    ) as t(table_name)
    cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) as p(privilege)
  ),
  'service_role retains CRUD access to durable control-plane tables'
);

select ok(
  to_regprocedure('public.claim_agent_task(text,text,integer)') is not null
  and to_regprocedure('public.heartbeat_agent_task(text,text,integer,bigint,text)') is not null
  and to_regprocedure('public.release_agent_task(text,text,text,bigint,text)') is not null
  and to_regprocedure('public.mark_stale_agent_tasks(integer)') is not null
  and to_regprocedure('public.reclaim_agent_task(text,text,integer)') is not null
  and to_regprocedure('public.transition_agent_task(text,text,text,jsonb,text,bigint,text)') is not null
  and to_regprocedure('public.dispatch_agent_attempt(text,uuid,text,text,text,text,text)') is not null
  and to_regprocedure('public.verify_agent_control_plane_security()') is not null
  and to_regprocedure('public.heartbeat_agent_task(text,text)') is null
  and to_regprocedure('public.heartbeat_agent_task(text,text,integer)') is null,
  'fenced RPC signatures exist and legacy unfenced heartbeat overloads do not'
);

select ok(
  (
    select bool_and(
      not has_function_privilege('anon', f.signature, 'EXECUTE')
      and not has_function_privilege('authenticated', f.signature, 'EXECUTE')
      and has_function_privilege('service_role', f.signature, 'EXECUTE')
    )
    from unnest(array[
      'public.claim_agent_task(text,text,integer)',
      'public.heartbeat_agent_task(text,text,integer,bigint,text)',
      'public.release_agent_task(text,text,text,bigint,text)',
      'public.mark_stale_agent_tasks(integer)',
      'public.reclaim_agent_task(text,text,integer)',
      'public.transition_agent_task(text,text,text,jsonb,text,bigint,text)',
      'public.dispatch_agent_attempt(text,uuid,text,text,text,text,text)',
      'public.verify_agent_control_plane_security()'
    ]) as f(signature)
  ),
  'final control-plane RPCs are executable by service_role only'
);

select ok(
  (
    select count(*) = 8
    from pg_proc p
    where p.oid in (
      to_regprocedure('public.claim_agent_task(text,text,integer)'),
      to_regprocedure('public.heartbeat_agent_task(text,text,integer,bigint,text)'),
      to_regprocedure('public.release_agent_task(text,text,text,bigint,text)'),
      to_regprocedure('public.mark_stale_agent_tasks(integer)'),
      to_regprocedure('public.reclaim_agent_task(text,text,integer)'),
      to_regprocedure('public.transition_agent_task(text,text,text,jsonb,text,bigint,text)'),
      to_regprocedure('public.dispatch_agent_attempt(text,uuid,text,text,text,text,text)'),
      to_regprocedure('public.verify_agent_control_plane_security()')
    )
    and p.prosecdef
    and coalesce(array_to_string(p.proconfig, ','), '') like '%search_path=pg_catalog, public%'
  ),
  'all SECURITY DEFINER control-plane RPCs pin a trusted search_path'
);

select is(
  (public.verify_agent_control_plane_security() ->> 'proof_complete')::boolean,
  true,
  'read-only control-plane security proof returns complete after migrations'
);

select * from finish();
rollback;
