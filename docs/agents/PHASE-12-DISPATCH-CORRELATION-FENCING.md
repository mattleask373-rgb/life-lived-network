# Phase 12 — Dispatch Correlation Fencing

**Status: IMPLEMENTED / NOT LIVE / HOSTED PROOF PENDING**

The durable dispatch boundary already used a correlation id for idempotency, but reconciliation showed that an existing correlation could be returned without proving that the caller's requested task, run, workspace, project, and provider matched the original attempt.

This phase makes correlation idempotency scoped rather than globally reusable.

## Contract

- run identity and actor/workspace/project are validated first;
- an existing correlation is returned only when task, run, workspace, project, and provider all match;
- conflicting correlation reuse is rejected;
- exact replay remains idempotent even after the task leaves READY;
- new dispatch still requires READY, L0-L2 autonomy, and non-human-gated risk;
- service-role execution remains the only database RPC path.

## Safety

No merge/deploy, production credentials, human-approval consumption, RLS/auth weakening, provider-specific authority, or second discovery engine.

## Verification state

Hosted Supabase execution/RLS behavior and exact-head CI remain unverified. The branch is NOT LIVE until those proofs and the human integration gate are satisfied.
