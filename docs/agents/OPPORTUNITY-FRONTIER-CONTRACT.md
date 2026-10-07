# Opportunity Frontier Contract (AI-NATIVE-06)

## Purpose

Observe where canonical discovery and ingestion may under-represent the real world, and turn that into a bounded, reviewable experiment — not a competing discovery engine.

## Inputs

- Supply observation derived from `findSupply()` answers (counts, bands, diagnostics, unknowns)
- Optional ingest freshness/provenance signals from `src/lib/ingest/*`

## Outputs

A `FrontierObservation` with epistemic class, structural gap (if any), candidate experiment, and human-gate requirements.

## Hard boundaries

- `findSupply()` remains the sole discovery authority
- No second matcher/ranker/recommender
- Empty supply ≠ proof of real-world emptiness
- No invented demand, inventory, or availability
- No production mutation

## Code

- `src/lib/opportunity-frontier.ts`
- `src/lib/opportunity-frontier.test.ts`
