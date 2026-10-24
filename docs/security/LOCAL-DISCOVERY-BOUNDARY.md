# Local-discovery database boundary

**Status (24 October 2026):** the base need-level RLS boundary and membership-expiry migration are merged into repository main and have passed empty-local-stack replay plus PostgREST tests. The fact-level policies and authenticated list/detail/supply integration in this PR are still a review candidate. No hosted database verification or deployment is claimed.

## Access contract

- `public` needs may be read anonymously when they are open.
- `local_discovery` needs may be read only by an authenticated user whose private, administrator-verified membership is for the exact place on the need.
- `profiles.place_id` and query-string filters are not authorization evidence because the user can change them.
- Membership and verification metadata live in the non-exposed `private.locality_memberships` table. Client roles have no direct table privileges. If a verifier account is deleted, a trigger revokes the memberships it verified and clears the verification timestamp, so account deletion does not fail on an inconsistent foreign-key/check-constraint combination. The helper function accepts only a need place ID and derives identity from `auth.uid()`; it does not accept a caller-supplied user ID.
- Verified membership authorization expires after **180 days**. The database predicate denies expired rows even if their stored status remains `verified`; a steward/admin must re-verify through the reviewed grant RPC to renew the period. No automatic expiry sweep or background revocation is claimed in this slice.
- Place access is exact by default. Membership at a parent locality does not automatically grant access to descendants; a village membership does not confer access to its parent or siblings. If inherited locality grants are introduced later, they need explicit product/security approval and their own matrix.

## Deliberate fail-closed product behavior

The public `getOpenNeeds` and `findSupplyForNeed` paths remain anonymous and explicitly `visibility = 'public'`. This PR adds separate signed-in `getOpenNeedsForMember` and `findSupplyForNeedForMember` readers using the request-bound Supabase client, so RLS—not a client-provided user ID or service-role bypass—authorizes local-discovery rows. Route consumers select the member reader only when a valid session exists; a signed-out user continues to receive public-only results.

The server still uses the canonical `findSupply()` engine. Query helpers require exact counts/complete row sets and fail closed on database error, missing collection/count, or cap mismatch; a too-wide locality must not be misrepresented as an empty result. Tests exercise the existing RLS matrix and the list/detail/supply path. Membership verification/provisioning remains a separately reviewed admin operation in stacked PR #354; until that path is reviewed and merged, local-discovery memberships must not be self-created or inferred from `profiles.place_id`.

## Membership provisioning

No self-service membership verification flow is implemented by this PR. A user-editable profile locality cannot be substituted. The proposed admin/steward workflow in #354 requires an administrator-authorized RPC, controlled verification methods/reasons, opaque evidence references, atomic audit rows, explicit revocation, and expiry renewal. Until that PR receives independent review and passes exact-head verification, do not provision real memberships or claim the complete feature is live.

## Required verification

- The migration must replay on a fresh local Supabase stack.
- `supabase test db --local` must pass the synthetic pgTAP test in `supabase/tests/local_discovery_place_boundary.test.sql`.
- The TypeScript contract tests must pass on this exact branch head.
- Human review must inspect the full effective grants/policy composition, including the pre-existing owner SELECT policy, before any merge.
- Only after Gate 0 identity is confirmed can a named disposable hosted project be tested. This migration is not authorization to update any connected Supabase project.
