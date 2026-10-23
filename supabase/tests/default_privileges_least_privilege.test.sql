BEGIN;
SELECT plan(3);

-- Disposable fixtures: the surrounding transaction is rolled back.
SET ROLE postgres;
CREATE TABLE public.atlas_acl_probe_postgres (id bigint);
CREATE SEQUENCE public.atlas_acl_probe_postgres_seq;
CREATE FUNCTION public.atlas_acl_probe_postgres_fn() RETURNS integer
  LANGUAGE sql AS 'SELECT 1';
RESET ROLE;

SELECT ok(
  (
    SELECT bool_and(NOT has_table_privilege(r.grantee, 'public.atlas_acl_probe_postgres', p.privilege))
    FROM (VALUES ('anon'), ('authenticated')) AS r(grantee)
    CROSS JOIN (VALUES
      ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
      ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
    ) AS p(privilege)
  ),
  'future public tables created by postgres grant no table privileges to client roles'
);

SELECT ok(
  (
    SELECT bool_and(NOT has_sequence_privilege(r.grantee, 'public.atlas_acl_probe_postgres_seq', p.privilege))
    FROM (VALUES ('anon'), ('authenticated')) AS r(grantee)
    CROSS JOIN (VALUES ('USAGE'), ('SELECT'), ('UPDATE')) AS p(privilege)
  ),
  'future public sequences created by postgres grant no sequence privileges to client roles'
);

SELECT ok(
  (
    SELECT bool_and(NOT has_function_privilege(r.grantee, 'public.atlas_acl_probe_postgres_fn()', 'EXECUTE'))
    FROM (VALUES ('anon'), ('authenticated')) AS r(grantee)
  ),
  'future public functions created by postgres are not executable by client roles by default'
);

SELECT * FROM finish();
ROLLBACK;
