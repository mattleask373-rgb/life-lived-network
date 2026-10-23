# Default privileges: implemented mitigation scope

This candidate is a deliberately narrow first step for issue #164.

## Implemented in this migration

For future objects created by `postgres` in `public`, it revokes default table privileges and sequence privileges from `anon` and `authenticated`. It also revokes PostgreSQL's default function `EXECUTE` grant to `PUBLIC` and schema-scoped `EXECUTE` defaults to the two client roles.

The isolated local Supabase replay proved that the migration role can alter `postgres` default ACLs, but cannot alter defaults owned by `supabase_admin`. The migration therefore does **not** pretend to fix `supabase_admin` defaults. A project administrator must confirm the target project and evaluate those defaults in that project's actual ownership context. This is a separate remaining gate for issue #164.

## Not changed

This migration does not revoke grants on existing tables, views, columns, sequences or functions and does not change RLS. Existing-object remediation remains blocked on a verified project identity and a complete query / ACL / RLS / RPC matrix.

## Disposable validation

`supabase/tests/default_privileges_least_privilege.test.sql` creates uniquely named probe objects as `postgres` inside a transaction, checks that `anon` and `authenticated` have no table, sequence or function access by default, and rolls back all probes. This verifies only the future defaults covered by this migration.

The historical ACL inventory came from a Lovable-connected database whose identity was not proven to match `supabase/config.toml`. This patch is not authorization to run changes against that hosted project or any production environment.
