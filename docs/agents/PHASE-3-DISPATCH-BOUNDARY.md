# Phase 3 Dispatch Boundary

**Status: IMPLEMENTED / HOSTED PROOF PENDING**

The Phase 3 dispatch boundary connects supervisor reconciliation to the durable execution ledger without making the executor live.

## Contract

1. The authenticated server boundary supplies actor + run + workspace identity.
2. The execution run must already exist and be ACTIVE.
3. Run actor, workspace, and project scope must match the requested dispatch.
4. The task must be READY and match workspace/project scope.
5. Only L0-L2 tasks are eligible for this bounded automatic path.
6. P0/P1 work remains human-gated.
7. The task is atomically fenced with a new lease generation/token.
8. Exactly one DISPATCHED attempt is created for a correlation id.
9. Replayed correlation returns the existing attempt rather than creating a second attempt.
10. An append-only audit record records the dispatch identity and scope.

## Explicit non-goals

This boundary does not authenticate browser input by itself, invoke a provider, declare success, consume human approval, merge, deploy, mint production credentials, or modify discovery/matching.

## Proof still required

- hosted Supabase migration execution;
- RLS and SECURITY DEFINER verification;
- authenticated middleware-to-run creation integration;
- concurrent dispatch race testing against the live database;
- stale lease recovery;
- provider execution wiring;
- full CI on the exact head;
- independent human review and merge.

Until those are proven, the 24/7 executor remains **NOT LIVE**.
