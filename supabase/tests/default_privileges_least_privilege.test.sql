begin;
select plan(3);

-- These objects are disposable test fixtures. Transaction rollback removes them.
set role postgres;
create table public.atlas_acl_probe_postgres (id bigint);
create sequence public.atlas_acl_probe_postgres_seq;
create function public.atlas_acl_probe_postgres_fn() returns integer
  language sql as 'select 1';
reset role;

set role supabase_admin;
create table public.atlas_acl_probe_supabase_admin (id bigint);
create sequence public.atlas_acl_probe_supabase_admin_seq;
create function public.atlas_acl_probe_supabase_admin_fn() returns integer
  language sql as 'select 1';
reset role;

select ok(
  (
    select bool_and(not has_table_privilege(r.grantee, t.table_name, p.privilege))
    from (values ('anon'), ('authenticated')) as r(grantee)
    cross join (values
      ('public.atlas_acl_probe_postgres'),
      ('public.atlas_acl_probe_supabase_admin')
    ) as t(table_name)
    cross join (values
      ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
      ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
    ) as p(privilege)
  ),
  'future public tables created by postgres and supabase_admin grant no table privileges to client roles'
);

select ok(
  (
    select bool_and(not has_sequence_privilege(r.grantee, s.sequence_name, p.privilege))
    from (values ('anon'), ('authenticated')) as r(grantee)
    cross join (values
      ('public.atlas_acl_probe_postgres_seq'),
      ('public.atlas_acl_probe_supabase_admin_seq')
    ) as s(sequence_name)
    cross join (values ('USAGE'), ('SELECT'), ('UPDATE')) as p(privilege)
  ),
  'future public sequences created by postgres and supabase_admin grant no sequence privileges to client roles'
);

select ok(
  (
    select bool_and(not has_function_privilege(r.grantee, f.signature, 'EXECUTE'))
    from (values ('anon'), ('authenticated')) as r(grantee)
    cross join (values
      ('public.atlas_acl_probe_postgres_fn()'),
      ('public.atlas_acl_probe_supabase_admin_fn()')
    ) as f(signature)
  ),
  'future public functions created by postgres and supabase_admin are not executable by client roles by default'
);

select * from finish();
rollback;
