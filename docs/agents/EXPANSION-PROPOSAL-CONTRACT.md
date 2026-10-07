# Expansion Proposal Contract

## Purpose

The Expansion Proposal is the smallest executable seam for the programme's
possibility engine. It records when an observed pattern appears to exceed the
current category or mechanism without claiming that the proposed expansion is
already true.

The module is pure and provider-neutral.

It does not:

- execute experiments;
- mutate ProgrammeState or production data;
- select providers;
- merge or deploy;
- change auth, RLS or schema;
- replace findSupply();
- create a matcher, ranker, recommender or discovery engine;
- create vector/embedding infrastructure;
- infer learner mastery;
- invent external-world evidence.

## Lifecycle

proposed -> testing -> accepted

Alternative terminal states are rejected and superseded.

An accepted proposal must reference the ordinary bounded task created for it.

A proposal may never silently jump from speculative possibility to accepted
implementation.

## Epistemic contract

Every proposal declares one of:

- REAL
- PLAUSIBLE
- EXPERIMENTAL
- SPECULATIVE
- IMAGINED
- UNKNOWN

REAL requires evidence.

UNKNOWN cannot be accepted.

IMAGINED and UNKNOWN require evidence-backed testing before acceptance.

The classification describes the proposal's current epistemic status; it is
not a confidence score.

## Human gate

A proposal requires a human gate when:

- risk is high or critical; or
- the proposal is irreversible.

The gate is represented explicitly on the proposal and must not be silently
downgraded.

Accepted proposals become ordinary bounded tasks. Acceptance does not grant
execution authority.

## Evidence

Evidence is represented by explicit source references. A proposal may state a
limitation without asserting that the proposed solution is true.

This allows the fleet to answer:

"What have we discovered that the current programme architecture does not
represent well?"

without pretending the discovery is a fact.

## Overlap

findExpansionOverlaps performs deterministic comparison against a supplied set
of existing proposals. It is deliberately not a matcher and does not inspect
supply, people or user data.

It identifies:

- exact proposal overlap;
- proposed-category overlap;
- proposed-mechanism overlap;
- originating-objective overlap.

## Persistence

There is no new persistence boundary in this slice. Persistence should be
added only when a canonical programme-state/control-plane storage boundary is
proven and reviewed.

## Verification

Required before acceptance:

- focused unit tests;
- lint;
- production build;
- hosted Verify.

No production merge is performed by the control tower.
