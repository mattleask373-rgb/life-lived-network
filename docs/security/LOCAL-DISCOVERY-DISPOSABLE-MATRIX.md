# local_discovery — Corrected Policy Design and Disposable Test Matrix

**Status:** security design and test contract only. The policy in PR #348 and stacked follow-ons are candidates, not main or hosted proof. Do not apply this document or any migration to a hosted project.

## Policy intent

- A need with visibility=public can be read anonymously only when it is open and current under the application's established freshness/expiry rules.
- A need with visibility=local_discovery is not anonymous-public. It may be read only by an authenticated user with a server-verified membership at the exact canonical place on that need.
- Parent/child place inheritance is not implicit. Membership to a village does not grant its parent or sibling; parent membership does not automatically grant every child.
- Profile.place_id, client-provided user IDs, query parameters, map viewport and selected place are not authorization evidence.
- Membership evidence belongs in a non-exposed private schema/table; client roles have no direct SELECT/INSERT/UPDATE/DELETE. Grant/revoke is an audited privileged server action with an administrator-role check and no self-approval.
- All SECURITY DEFINER functions use a fixed empty search_path, schema-qualified references, a minimal body and explicit execution grants. Direct table/API and every RPC must preserve the same boundary.
- The canonical matching engine remains the sole source of matching logic. Do not solve missing local results by bypassing RLS with service_role or broadening an anonymous query.

## Read-path contract

1. Anonymous list/map/search and public need-to-supply reads filter explicitly to public visibility and still rely on RLS.
2. Signed-in local_discovery reads use the request-bound authenticated Supabase client and the verified membership RLS policy.
3. Detail, related supply, cached response, count, export and RPC endpoints must not bypass the same visibility gate.
4. A read error or unauthorised scope is not “no matching needs”. It must be an explicit failure/unknown state.
5. Until all list → detail → supply paths share this contract, no local_discovery content is included in public reads.

## Disposable test matrix

Fixtures must be synthetic and use distinct canonical place IDs: locality A, its child A1, unrelated locality B; users A, B, child-member, no-membership, admin/verifier; public need; current local needs at A/A1/B; stale/expired/revoked cases. Use rollback transactions in pgTAP, and an HTTP/PostgREST black-box test against loopback-only local API+DB. Do not send tokens, row contents or keys to logs.

| Actor / path | Target | Expected result |
|---|---|---|
| anon | query all local_discovery | zero visible rows; direct table/API path |
| anon | query current public need | exactly that eligible public row |
| user A with verified A membership | current local need at A | visible |
| user A | current local need at unrelated B | zero rows |
| user A | current local need in child A1 | denied unless A1 itself is independently verified |
| user B with verified B membership | B local need | visible |
| child member verified only for A1 | A1 local need | visible |
| child member verified only for A1 | parent A and sibling needs | zero rows |
| authenticated user with profile.place_id=A but no membership | A local need | zero rows |
| user A changes profile place to B | B local need | zero rows; changing profile does not grant access |
| user A supplies another user ID in query or RPC args | target user's place | still bound to auth.uid(); no caller-selected identity |
| member of A | stale need at A | zero rows |
| member of A | expired or ended need at A | zero rows |
| member of A | revoked membership at A | zero rows |
| any client role | private membership table | permission denied; no evidence rows returned |
| anon | membership-check helper / admin RPC | execute denied |
| authenticated non-admin | membership grant/revoke RPC | denied |
| admin grants own membership | self-approval attempt | denied and audit unchanged |
| admin grant with missing/invalid evidence reference | mutation | rejected before privileged write |
| admin revoke | membership mutation + audit append | both commit atomically or both roll back |
| verifier account deleted | membership verified by that account | membership is revoked without deletion failure |
| direct PostgREST query with explicit place filter | another locality | still denied by RLS; filters do not create permission |
| detail endpoint for private need | guessed UUID | indistinguishable from not-found or explicit unauthorized per API contract; no private fields leak |
| findSupplyForNeed / related RPC for local_discovery without authorized user | restricted need | no supply/matching side effects or records returned |
| local-discovery detail + supply with authorized user | same place | permitted only through authenticated RLS path and eligible records |
| failed/missing membership query | local needs | fail closed, not global fallback |
| oversized place scope or count failure | locality read | explicit too-wide/partial/error result; scope not dropped |

## Verification layers and exit criteria

**Source / TypeScript**
- Unit tests verify no user-supplied identity is authoritative, strict input, controlled reasons, and private fields do not enter public response types.
- Assert anonymous readers use explicit visibility=public and local matching stops before elevated operations for unauthorized records.

**Disposable SQL**
- Fresh local Supabase start and all migrations replay from empty database.
- pgTAP verifies RLS predicate composition, exact locality, open/current state, revoked/stale/expired cases, default ACLs, private-schema grants, function privileges/search_path, administrator authorization, self-approval and audit atomicity.
- Inspect pg_policies, pg_class.relrowsecurity/relforcerowsecurity, pg_proc.prosecdef/proconfig, has_table_privilege, has_function_privilege, default ACLs for every object-creating role and ownership. Include prior policies, not only the new one.

**Black-box HTTP**
- PostgREST direct reads use anon JWT and signed local synthetic user JWTs. Assert both row shape and exact counts. Use local loopback API and DB only; the test must refuse non-loopback hostnames before connecting.
- Probe direct /rest/v1/needs, any exposed views, local detail/search server functions and related RPCs. Verify no sensitive response body is logged.

**Review / hosted proof**
- Independent reviewer examines the full SQL/migration lineage and effective grants.
- Supabase Preview skipped is not a pass.
- Only after Gate 0 identity is confirmed may the owner authorize a separately named disposable hosted project. Capture project reference, migration SHA, test run, roles tested and rollback result.
- Production is never the test target.

## Current candidate context

- PR #348 proposes the policy, synthetic pgTAP and loopback-only PostgREST harness.
- PR #350 scopes personal facts to verified places; #352 adds authenticated local reads; #354 adds audited membership provisioning.
- These candidates are stacked and no one of them alone closes Gate 4. Review the exact current heads and conflicts. The current main remains 182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f and does not yet include these proposed changes.
