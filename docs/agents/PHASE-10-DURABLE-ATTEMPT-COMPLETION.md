# Phase 10 — Durable Attempt Completion Fencing

**Status: IMPLEMENTED / NOT LIVE / HOSTED PROOF PENDING**

This slice wires the existing pure attempt-level fencing policy to a durable server-only Supabase boundary.

## Durable contract

`record_agent_attempt_result(...)` requires:
- authenticated actor identity from the server adapter;
- run identity;
- task identity;
- workspace and project scope;
- current lease generation;
- current lease token;
- active attempt state.

It locks both the attempt and task, verifies that the attempt and current task lease still agree, requires a live lease, and only records provider-safe `VERIFYING` or `FAILED` results.

## Safety

The RPC cannot:
- mark work ACCEPTED;
- mark work INTEGRATED;
- mark work DONE;
- consume human approval;
- merge;
- deploy;
- create production credentials;
- weaken RLS/auth;
- bypass lease fencing.

After reclaim, generation N / token N is rejected against generation N+1 / token N+1.

## Verification state

Pure fencing tests cover current generation/token acceptance, stale generation rejection, terminal-attempt rejection, and acceptance-intent rejection.

Hosted Supabase migration/RLS behavior and exact-head CI remain unverified.