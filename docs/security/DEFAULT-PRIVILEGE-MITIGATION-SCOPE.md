# Default privileges: implemented mitigation scope

This change is a narrowly scoped first step for issue #164. It removes broad default grants to \`anon\` and \`authenticated\` for **future** objects created by \`postgres\` or \`supabase_admin\` in \`public\`:
- tables: all table-level privileges;
- sequences: all sequence privileges;
- functions: default EXECUTE for PUBLIC, plus schema-scoped EXECUTE for client roles.

It deliberately does **not** revoke grants on existing tables, sequences, views, columns or functions, and it does not alter RLS policies. Existing-object remediation remains blocked on a verified target identity and a complete query / ACL / RLS / RPC matrix.

Validation is in \`supabase/tests/default_privileges_least_privilege.test.sql\`. It creates uniquely named fixtures inside a test transaction as both object-creating roles, checks table/sequence/function access for \`anon\` and \`authenticated\`, then rolls back. The tests must pass on an empty local Supabase database before this migration is considered ready for review.

The historical ACL inventory was collected from a Lovable-connected database whose Supabase project identity was not proven to match \`supabase/config.toml\`. This patch is not authorization to apply migrations to that hosted project or any production environment.
