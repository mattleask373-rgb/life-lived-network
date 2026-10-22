# Least-privilege default ACL proposal (review only)

**Status:** proposal only — do not apply to any hosted database.  
**Related issue:** [#164 — audit and narrow public-schema default privileges](https://github.com/mattleask373-rgb/life-lived-network/issues/164)  
**Evidence date:** 2026-10-22

## Scope and identity warning

A read-only metadata inventory was run against the Supabase database enabled for Lovable project `Real World Atlas` (Lovable project ID `b3293d2a-3218-4206-ab04-af8e984023ac`). No application rows, credentials, secrets, or message content were queried.

The repository's `supabase/config.toml` currently names project ref `csgngcnaqeoxyopvnzjo`. It has **not** been proven that the Lovable-connected database is that same Supabase project. The findings below are therefore evidence about the Lovable-connected database only until the owner reconciles the target identity.

## Sanitized metadata findings

- 22 base tables were found in schema `public`; all are owned by `postgres`.
- All 22 report RLS enabled; **none report `FORCE ROW LEVEL SECURITY`**.
- The `pg_default_acl` rows for both `postgres` and `supabase_admin` grant `arwdDxtm` on future public tables to `anon`, `authenticated`, and `service_role`. Default sequence ACLs grant `rwU` to `anon`, `authenticated`, and `service_role`; default function ACLs grant `EXECUTE` (`X`) to those roles.
- Current `information_schema.role_table_grants` summary: `anon` has table-level INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER privileges on **21/22** tables and SELECT on 19; `authenticated` has those table-level write-related privileges on **22/22** tables and SELECT on 20. These are SQL privilege facts, not proof each operation is exposed through the app.
- The `arwdDxtm` ACL string includes INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, and TRIGGER. RLS policies can still deny ordinary row operations, but row-level policies do not constrain TRUNCATE.
- The `information_schema.column_privileges` view returns 1,100 `anon` privilege rows over 21 tables and 1,136 `authenticated` privilege rows over 22 tables. This view can reflect table-level/inherited column privileges; the final matrix must separately inspect explicit column ACLs and remove unnecessary grants.
- `source_records` and `sources` currently lack SELECT for `anon`/`authenticated` in the inspected table ACL, but still show broad write-related privileges. Their current RLS policy is service-role-only.
- Public routine privilege metadata shows EXECUTE on 2 routines for `anon` and 4 for `authenticated`. The public routines are `touch_updated_at()`, `update_updated_at_column()`, `has_role(uuid, app_role)`, and `is_safety_reviewer(uuid)`. None is marked SECURITY DEFINER in the current snapshot. The two role-check functions require the supplied user ID to equal `auth.uid()`; the trigger routines return `trigger`. Default EXECUTE grants remain overly broad for future routines and should be narrowed deliberately.
- Existing RLS policies appear to scope ordinary row operations by owner, discoverability, publication state, public opt-in, participants, block state, or safety-reviewer status. This does **not** make broad grants desirable or prove an exploitable path. The final effective-role tests must include grants, row policies, column grants, routines, views, and the actual PostgREST/RPC surface.

### Current table inventory

| Table | RLS | Intended access class (proposal; validate against current server code) |
|---|---|---|
| `places` | enabled | Public read-only canonical geography |
| `listings` | enabled | Public read of published records; authenticated owner CRUD subject to RLS |
| `listing_photos` | enabled | Public read only for photos belonging to published listings; authenticated owner CRUD subject to RLS |
| `needs` | enabled | Public read of open public/local-discovery needs; authenticated owner CRUD subject to RLS |
| `profiles` | enabled | Public read only of discoverable profiles (or own profile under policy); authenticated owner CRUD subject to RLS |
| `availability_windows` | enabled | Public read only of currently visible availability; authenticated owner-managed operations |
| `hour_offers` | enabled | Public read only of open hours; authenticated owner-managed operations |
| `contribution_preferences` | enabled | Public read only for discoverable people; authenticated owner-managed operations |
| `person_capabilities` | enabled | Public read only for discoverable people; authenticated owner-managed operations |
| `opportunity_preferences` | enabled | Public read only for discoverable people; authenticated owner-managed operations |
| `service_areas` | enabled | Public read only for discoverable people; authenticated owner-managed operations |
| `journeys` | enabled | Public read only for opted-in public journeys; authenticated owner CRUD subject to RLS |
| `journey_places` | enabled | Public read only for places on opted-in public journeys; authenticated owner CRUD subject to RLS |
| `saved_items` | enabled | Authenticated owner-only CRUD; no anonymous access |
| `place_memories` | enabled | Authenticated owner-only CRUD; no anonymous access |
| `user_blocks` | enabled | Authenticated owner read/insert/delete; no anonymous access |
| `connection_requests` | enabled | Authenticated participant read/insert/update, subject to participant and block rules |
| `connection_messages` | enabled | Authenticated participant read/insert, subject to participant and block rules |
| `content_reports` | enabled | Authenticated report submission/read by reporter and reviewer-only review update |
| `user_roles` | enabled | Authenticated read of own roles only; no client-side role mutation |
| `sources` | enabled | Service-role/server-only source management |
| `source_records` | enabled | Service-role/server-only provenance/ingestion management |

## Proposed least-privilege policy

This is a **grant design**, not an executable migration. Final statements must be generated only after the owner confirms the target project and the application-query inventory is checked against the exact current main.

1. For both object-creating roles, remove default table privileges from `anon` and `authenticated`; remove their default sequence privileges; remove default function EXECUTE unless a specific function is explicitly reviewed and granted. Keep service-role defaults only to the extent required by reviewed server-side ingestion and admin paths.
2. For existing tables, revoke broad table privileges from `anon` and `authenticated`, then grant only the operations each reviewed access class needs. Do not grant TRUNCATE, REFERENCES, or TRIGGER to client roles.
3. Preserve anonymous SELECT only for genuinely public-read tables and only where the current RLS policy is intended to permit public reads: `places`, published `listings`, eligible `listing_photos`, eligible public `needs`, discoverable profile/capability/preference/service-area/availability data, and opted-in public journeys/places.
4. Grant authenticated SELECT/INSERT/UPDATE/DELETE only where the corresponding owner-scoped RLS policies and application operations require them. Do not grant DELETE to `connection_requests`, `connection_messages`, `content_reports`, or `user_roles` unless a separately reviewed product requirement and policy explicitly needs it.
5. Keep `sources` and `source_records` unavailable to client roles; server-side code must use the approved privileged boundary.
6. Audit column grants and function EXECUTE separately. Revoke unneeded column-level grants and broad function EXECUTE, then add narrow explicit grants for approved functions only.
7. Treat RLS policies and SQL grants as separate layers. Preserve the existing RLS predicates; this proposal must not weaken owner, discoverability, public opt-in, block, or reviewer checks.

### Default-privilege SQL shape (illustrative only; NOT TO APPLY)

```sql
-- Run only in a confirmed disposable database after role ownership is verified.
-- These examples intentionally do not change a hosted project.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
```

The final migration must account for global versus schema-specific default ACLs, object ownership, the migration runner's actual role, Supabase-managed grants, and explicitly required function/sequence privileges. Do not copy/paste this illustrative block into production.

## Required validation before any hosted application

1. Owner confirms the exact Supabase project reference and whether it is development, staging, or production.
2. Produce a per-table/per-operation matrix from current server functions, client queries, migrations, and the exact public APIs used by the app.
3. Apply candidate grants only to a disposable/local database created from the repository migrations.
4. Add automated tests using separate anonymous and authenticated roles: expected public reads succeed; owner operations affect only own rows; private records, cross-user access, blocked participants, safety reports, source tables, and role mutation are denied as intended.
5. Test default ACLs by creating representative new tables, sequences and functions under both `postgres` and `supabase_admin`; verify no broad client privileges appear.
6. Verify both grants and RLS with the same interface the app uses (including PostgREST where relevant); do not infer exploitability from ACL metadata alone.
7. Prepare a rollback plan restoring the exact pre-change grants/default ACLs from a sanitized snapshot. Have a second reviewer approve the SQL and test evidence.
8. Only after all prior gates pass may the owner separately authorise a hosted migration. This PR does not authorise that action.

## Rollback principles

- Save a sanitized pre-change snapshot of `pg_default_acl`, table/column ACLs, role grants, policies and object owners.
- Revert by restoring the specific prior grants/default ACLs from the reviewed snapshot, not by globally granting all privileges.
- Stop immediately if a required public read or authenticated owner action fails; do not compensate by granting broad privileges.
- No live DB mutation is part of this proposal.

## Current effective table privilege matrix (read-only catalog snapshot, 2026-10-22)

The table below reports SQL-level effective privileges returned by PostgreSQL's `has_table_privilege` for the `anon` and `authenticated` roles, along with RLS metadata and policy counts. This is **not** proof that PostgREST can perform every operation; policies and API exposure still determine reachability. Names/counts only—no application rows.

| Table | Owner | RLS | FORCE RLS | anon SELECT | anon write* | auth SELECT | auth write* | RLS policies |
|---|---|:---:|:---:|:---:|---|:---:|---|---:|
| `availability_windows` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 3 |
| `connection_messages` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 2 |
| `connection_requests` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 3 |
| `content_reports` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 4 |
| `contribution_preferences` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 3 |
| `hour_offers` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 2 |
| `journey_places` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 5 |
| `journeys` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 5 |
| `listing_photos` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 4 |
| `listings` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 4 |
| `needs` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 5 |
| `opportunity_preferences` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 3 |
| `person_capabilities` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 3 |
| `place_memories` | `postgres` | yes | no | no | — | yes | IUDT | 4 |
| `places` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 1 |
| `profiles` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 4 |
| `saved_items` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 4 |
| `service_areas` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 3 |
| `source_records` | `postgres` | yes | no | no | IUDT | no | IUDT | 1 |
| `sources` | `postgres` | yes | no | no | IUDT | no | IUDT | 1 |
| `user_blocks` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 3 |
| `user_roles` | `postgres` | yes | no | yes | IUDT | yes | IUDT | 1 |

* `I` = INSERT, `U` = UPDATE, `D` = DELETE, `T` = TRUNCATE. REFERENCES/TRIGGER privileges and explicit column grants are separate surfaces and remain part of the full review.

### Required per-table follow-up

- For every row above, inspect each policy's command, roles, USING and WITH CHECK conditions; the policy count alone is not an access decision.
- Check column-level ACLs separately and compare them against all public DTOs and server functions.
- Enumerate views/materialized views, public RPCs, SECURITY DEFINER functions, execute grants, exposed schemas, grants to PUBLIC and owner/bypass paths.
- Test expected read/create/update/delete and denied cross-owner/private operations with real anon/authenticated JWT roles against a disposable instance/PostgREST endpoint. Test TRUNCATE independently; it is not row-policy constrained.
- This table does not authorize any hosted change. The live database was only queried for catalogs; no rows, grants, policies, schema or application settings were changed.


## Supplemental cross-schema and Storage inventory — read-only snapshot, 2026-10-22

This supplement extends the public-table inventory above. These results were obtained from catalog-only queries through the Lovable connector. **The connected project still has not been reconciled to** `supabase/config.toml` project ref `csgngcnaqeoxyopvnzjo`. They are not proof of a remotely exploitable path or a confirmed breach. No rows, permissions, schema, bucket setting or application setting was changed.

### Default ACL scope wider than the app schema

The current `pg_default_acl` snapshot also showed:

- `postgres` defaults in `storage`: future tables `arwdDxtm`, sequences `rwU`, function EXECUTE `X` for `anon`, `authenticated` and `service_role`.
- `supabase_admin` defaults in `storage`, `graphql` and `graphql_public`: future tables `arwdDxtm`, sequences `rwU`, function EXECUTE `X` for `anon`, `authenticated` and `service_role`, as well as the previously recorded defaults in `public`.
- Schema ACLs show `USAGE` on `public` and `storage` for anon/authenticated, but no `CREATE`; `private` has no anon USAGE but authenticated has USAGE. Schema USAGE is not object-level access; each relation/function ACL and RLS policy still matters.
- `graphql_public.graphql(text,jsonb,jsonb,jsonb)` currently has EXECUTE for PUBLIC. This can be normal Supabase GraphQL configuration; do not revoke it blindly. Confirm the actual exposed schemas, GraphQL API configuration and reachable underlying objects. Broad default ACLs for future objects in `graphql`/`graphql_public` still need a vendor-compatible least-privilege decision.
- Default ACLs in provider-managed schemas such as `auth`, `extensions`, `realtime` and GraphQL may be intentional vendor configuration. Any policy must distinguish application-owned schemas from vendor-owned schemas and preserve managed-service operation.

**Recommendation:** inventory the creating role, schema, object type, owner, default ACL and intended exposure for every schema before any default privilege migration. Prefer limiting changes to app-owned schemas until the platform vendor confirms safe handling for managed schemas.

### Storage relations and photo bucket

Catalog metadata from the connected database:

| Storage relation | RLS | FORCE RLS | Anon/authenticated ACL summary | Current policy observation |
|---|---|---|---|---|
| `storage.objects` | enabled | no | both have SELECT/INSERT/UPDATE/DELETE table privileges | four policies: profile-photo owner/discoverable SELECT; owner-scoped INSERT/UPDATE/DELETE |
| `storage.buckets` | enabled | no | both have SELECT/INSERT/UPDATE/DELETE table privileges | no `pg_policies` row was returned for buckets; ordinary client row access should therefore be denied by RLS, but the grant surface is broader than needed |
| `storage.buckets_analytics` | enabled | no | anon/authenticated table write privileges | policy/effective API reachability needs explicit checking |
| `storage.buckets_vectors` | enabled | no | anon/authenticated SELECT only | policy/effective API reachability needs explicit checking |
| `storage.s3_multipart_uploads`, `storage.s3_multipart_uploads_parts` | enabled | no | anon/authenticated SELECT only | inspect service-specific policy and upload flows |
| `storage.vector_indexes` | enabled | no | anon/authenticated SELECT only | inspect whether API exposure is intended |
| `storage.migrations` | enabled | no | owner-only relation ACL in this snapshot | provider-managed, do not change without vendor guidance |

The only bucket in the connected database was `profile-photos`: `public=false`, maximum file size 2 MiB, no allowed MIME-type list, owner NULL. Do not change its visibility or policies without human approval. For the application media pipeline, require MIME allow-listing, actual file-type sniffing, EXIF/GPS stripping, moderation/reporting, rights metadata and deletion propagation. Profile-photo policies currently rely on the discoverable-profile rule or the user's own storage folder; test cross-user reads and writes through the actual Storage API with anonymous and two authenticated JWTs.

### SECURITY DEFINER routines and policy execution

- `private.people_are_blocked(uuid,uuid)` is SECURITY DEFINER, owner `postgres`, `SET search_path TO 'public'`, and its current ACL contains EXECUTE only for `postgres` and `service_role`—not `authenticated`.
- Current RLS policies on `connection_requests` (SELECT/INSERT/UPDATE) and `connection_messages` (SELECT/INSERT) call `private.people_are_blocked(...)`. The missing authenticated EXECUTE may cause ordinary authenticated conversation operations to fail with permission-denied behavior; this must be reproduced on a disposable Postgres/PostgREST instance before any grant change. Do not grant EXECUTE to PUBLIC; first decide whether the helper should be callable directly and test its isolation semantics.
- `public.handle_new_user()` is also SECURITY DEFINER with search path `public`, although the current body fully qualifies `public.profiles`. Review whether both functions can safely use `SET search_path = ''` and fully qualified object names as defense in depth, with regression tests and owner approval.
- `public.touch_updated_at()` and `public.update_updated_at_column()` are currently executable by PUBLIC/anon/authenticated. Audit their definitions and RPC exposure. If they are trigger-only, use trigger invocation tests before narrowing EXECUTE; the function default ACLs otherwise grant execution to future routines too.
- `service_role` has BYPASSRLS, expected for the privileged Supabase role. Treat it as a server-side secret boundary; do not use it in browser code, and audit each server/admin client call site.

### Required storage/routine tests before migration approval

1. Verify target project identity and API-exposed schemas; identify provider-managed vs app-owned schema ownership.
2. Create a disposable clone and compare relation ACLs, column ACLs, routine EXECUTE, default ACLs and RLS policies before/after a proposed migration.
3. Under anonymous and two distinct authenticated JWTs, test profile-photo object read, upload, replace, delete, path traversal/foreign-folder attempts, unsupported MIME and oversized file rejection. Test `storage.buckets` read/write/DDL-like API paths are denied to clients as intended.
4. Under authenticated user roles, run the current connection request/message RLS predicates on the test DB. Verify the current missing EXECUTE behavior, then validate the minimum safe helper grant or policy redesign; check blocked user A/B and unrelated user C.
5. Test the exposed GraphQL function and underlying public schema only through the intended API; ensure private tables/functions and hidden/non-discoverable records cannot be reached.
6. Test new object creation under the actual migration role in each app-owned schema to prove default ACLs start private; do not mutate vendor schemas without vendor-specific approval.
7. Prepare an exact rollback restoring the reviewed pre-change privileges, and include role membership/ownership/column grants/storage/API exposure. Run CI against the disposable DB before any host approval.

### Updated security disposition

Treat #164 as P0 because current catalogs show excessive existing grants and permissive defaults. The current evidence also suggests a potential availability issue in connection RLS function execution. **Neither is yet proof that a remote attacker can use the privileges**, because RLS, API schema exposure and runtime identity must be tested. No migration, RLS policy, grant, Storage bucket or provider-managed schema change is authorised by this proposal. Any SQL that changes privileges must remain gated on project identity, disposable-role/PostgREST evidence, independent review, a rollback plan and explicit human approval.
