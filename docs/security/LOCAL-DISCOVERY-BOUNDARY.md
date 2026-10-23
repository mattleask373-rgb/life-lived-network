# Local-discovery database boundary

**Status:** candidate migration on an isolated non-main branch. Not merged, not deployed, and not tested against a hosted database.

## Access contract

- `public` needs may be read anonymously when they are open.
- `local_discovery` needs may be read only by an authenticated user whose private, administrator-verified membership is for the exact place on the need.
- `profiles.place_id` and query-string filters are not authorization evidence because the user can change them.
- Membership and verification metadata live in the non-exposed `private.locality_memberships` table. Client roles have no direct table privileges. The helper function accepts only a need place ID and derives identity from `auth.uid()`; it does not accept a caller-supplied user ID.
- Place access is exact by default. Membership at a parent locality does not automatically grant access to descendants; a village membership does not confer access to its parent or siblings. If inherited locality grants are introduced later, they need explicit product/security approval and their own matrix.

## Deliberate fail-closed product behavior

The current generic open-needs server reader uses the anonymous Supabase client. Once this policy lands, that reader will show `public` needs only—even when it asks PostgREST for both public and local-discovery visibility values. This is intentional until the product's list, detail, and supply-matching paths can all use the authenticated user context and the same policy.

Do not re-enable `local_discovery` in the anonymous read path or create a service-role bypass to make rows appear in the UI. The next implementation slice must:
1. Add an authenticated, locality-scoped read path using the request's verified Supabase user.
2. Keep local-discovery details and matching behind the same authenticated RLS checks, not the anonymous `findSupplyForNeed` reader.
3. Preserve the single canonical `findSupply()` engine.
4. Distinguish no matching rows from a failed/unauthorized locality read.
5. Add integration tests for list → detail → supply, plus cross-place direct table/API calls.

## Membership provisioning

No self-service membership verification flow is implemented by this migration. A user-editable profile locality cannot be substituted. Verified memberships must be provisioned by a future reviewed administrator/steward workflow or trusted server process, with evidence and revocation. Until then, local-discovery records are not anonymously visible.

## Required verification

- The migration must replay on a fresh local Supabase stack.
- `supabase test db --local` must pass the synthetic pgTAP test in `supabase/tests/local_discovery_place_boundary.test.sql`.
- The TypeScript contract tests must pass on this exact branch head.
- Human review must inspect the full effective grants/policy composition, including the pre-existing owner SELECT policy, before any merge.
- Only after Gate 0 identity is confirmed can a named disposable hosted project be tested. This migration is not authorization to update any connected Supabase project.
