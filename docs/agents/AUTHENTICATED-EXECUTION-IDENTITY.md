# Authenticated Execution Identity Contract

Status: DESIGN / NOT LIVE

## Purpose

Lease fencing prevents stale workers from mutating current ownership, but fencing is not authentication. The control plane must derive execution identity from an authenticated server boundary rather than trusting a caller-supplied owner string.

## Required identity

A durable execution claim must bind:

- actor identity
- execution/run identity
- workspace scope
- project scope
- task identity
- lease generation
- lease token

The caller may provide a requested label for observability, but the durable owner must be derived from authenticated context.

## Required security properties

1. Anonymous callers cannot claim or reclaim work.
2. A caller cannot claim work outside its workspace/project scope.
3. A stale worker cannot heartbeat, release, or transition using an old generation/token.
4. A new worker cannot reuse another actor's run identity.
5. Human approval is separate from execution identity.
6. An executor cannot self-authorize a consequential human gate.
7. Service-role credentials remain server-only.
8. RLS and SECURITY DEFINER functions are explicitly verified in hosted Supabase.
9. Provider-specific credentials never become the canonical identity model.

## Proof obligations

Before L3+ autonomy is claimed, tests and hosted verification must demonstrate:

- forged owner rejection
- anonymous claim rejection
- cross-scope claim rejection
- replayed approval rejection
- expired approval rejection
- stale/fenced owner rejection
- duplicate claim mutual exclusion
- reclaim only after stale transition
- cancelled work cannot resurrect
- audit evidence records actor/run/scope

Until those proofs exist, execution autonomy remains UNKNOWN / HUMAN-GATED.
