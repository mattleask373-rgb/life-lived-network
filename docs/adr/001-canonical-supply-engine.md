# ADR 001: One Canonical Possibility Supply Engine

**Status:** Accepted  
**Date:** 2026-10-06  
**Context:** Phase 4/5 control plane establishment

## Decision
The file `src/lib/supply-engine.ts` (and its supporting pure modules) is the single deterministic possibility/matching/discovery kernel.

## Consequences
- No parallel matching engine, recommendation engine, vector system, graph database, or opaque AI ranking may be introduced for the core discovery path without a new ADR that explicitly supersedes this one.
- Harden, test, and extend the existing engine.
- Preserve named bands and deterministic ordering unless a concrete architectural reason (with evidence) proves otherwise.
- Users must be able to understand *why* a possibility exists.

## Alternatives considered
- Building a second “smarter” engine → rejected (duplication, drift, loss of explainability).
- Replacing bands with scores → rejected (opaque ranking violates product principles).
