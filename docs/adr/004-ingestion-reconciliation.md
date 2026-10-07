# ADR 004: Ingestion Reconciliation — Single Provider-Neutral Boundary

**Status**: Proposed  
**Date**: 2026-10-06  
**Decision makers**: Architecture / Kernel + External World teams  
**Related**: PR #43, existing `src/lib/ingest/*`, Ticketmaster adapter on main

## Context

Two parallel provider-neutral boundaries currently exist:

1. **Canonical (main)**  
   `src/lib/ingest/contract.ts` defines `SourceEvent` + `SourceAdapter`.  
   Ticketmaster adapter already lives at `src/lib/ingest/ticketmaster.ts` and produces `SourceEvent`.

2. **Proposed (PR #43 branch)**  
   `src/lib/external-world.ts` defines `ExternalEvent` + provenance / freshness / discoverability helpers.  
   A second Ticketmaster adapter produces `ExternalEvent`.

Keeping both creates permanent dual abstraction, dual normalisation, dual freshness logic and dual identity rules. This violates the permanent architectural charter (one discovery authority, one provider-neutral seam).

## Decision

**Option B — Evolve the existing ingest contract to absorb the high-value pieces of the External World layer.**

- `SourceEvent` / `SourceAdapter` remain the single provider-neutral boundary.
- Ticketmaster (and all future providers) are only adapters that emit `SourceEvent`.
- High-value additions from PR #43 are absorbed:
  - Deterministic locality resolution against `PlaceIndex`
  - Explicit freshness evaluation (`current` | `stale` | `expired` | `unknown`)
  - Explicit cancellation / postponed state
  - Discoverability gate (resolved locality + future start + current freshness + not cancelled)
  - Stronger provenance (`provider` + `providerEntityId` + `observedAt` + `sourceUrl`)
- The parallel `external-world.ts` / second adapter path is retired once absorption is complete.
- No second matching, ranking or discovery engine is introduced.

## Consequences

### Positive
- One seam for all external data.
- Existing tests and refresh pipeline continue to work.
- Locality, freshness and provenance become first-class without rewriting the kernel.
- PR #43 can be rebased / rewritten as an evolution of ingest rather than a competing system.

### Negative / Risks
- Requires careful migration of any code that already consumes the new ExternalEvent shape on the PR branch.
- Temporary dual-path risk while the PR is reconciled (mitigated by this ADR and the serial merge order).

### Forbidden
- Option D (“keep both because both work”).
- Letting Ticketmaster fields leak into domain models or UI.
- Creating a second discovery authority.

## Implementation outline

1. Extend `SourceEvent` (or a thin enrichment type) with optional localityId, explicit freshness, richer provenance if not already present.
2. Move locality-resolution helper into ingest or places layer.
3. Convert the better Ticketmaster parsing logic into the existing `ticketmaster.ts` adapter (or a pure helper it calls).
4. Add / migrate tests from PR #43.
5. Delete parallel external-world path once green.
6. Update PR #43 (or open a follow-up) to target this single boundary.

## Acceptance

- Exactly one provider-neutral contract remains.
- All existing ingest tests pass.
- New tests cover locality resolution, freshness, cancellation, discoverability and identity.
- No schema / RLS change required for this ADR.
- Human review before any production merge.

## Related

- ADR 001 Canonical Supply Engine
- docs/agents/INVARIANTS.md
- Permanent North Star: PEOPLE → CAPABILITIES → NEEDS → PLACES → TIME → POSSIBILITIES → CONNECTION → REAL LIFE
