# Phase 11 — Idempotent Attempt Result Delivery

**Status: IMPLEMENTED / NOT LIVE / HOSTED PROOF PENDING**

This slice closes a concrete P1 gap in the Phase 10 durable attempt-result boundary: duplicate delivery was not explicitly idempotent.

## Contract

For a single attempt and lease generation:

- the first valid VERIFYING or FAILED result records a fingerprint;
- an exact replay of the same fenced result returns the existing attempt without appending evidence or a second audit event;
- a conflicting result for the same attempt is rejected;
- stale generation/token, scope, actor, run, expired lease, and terminal-attempt checks remain enforced;
- ACCEPTED, INTEGRATED, and DONE remain outside this boundary.

The fingerprint binds result status, evidence, actor, run, workspace, project, lease generation, and lease token.

## Safety

No merge, deploy, production credentials, human-approval consumption, RLS/auth weakening, provider-specific authority, or second discovery engine is introduced.

## Verification state

The SQL migration is implemented, but hosted Supabase execution/RLS verification and exact-head CI remain unverified. This branch is therefore NOT LIVE until those proofs exist and the human integration gate is satisfied.
