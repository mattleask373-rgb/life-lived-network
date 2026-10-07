# AI-NATIVE Cross-Kernel Compatibility Matrix

This is a research artifact for #88. It is intentionally descriptive and does not introduce a runtime composition layer.

| Kernel | Evidence model | Epistemic model | Uncertainty | Risk / gate | Downstream identity |
|---|---|---|---|---|---|
| ProgrammeState | `ProgrammeEvidenceRef` | ProgrammeEpistemicClass | `uncertainties`, claim uncertainty | ProgrammeRiskClass + explicit gate | stateId |
| Experiment | reuses ProgrammeEvidenceRef | reuses ProgrammeEpistemicClass | hypothesis uncertainty + result follow-up uncertainty | risk + reversible + explicit gate | experimentId / hypothesisId / stateId |
| Experiment Task Adapter | reuses ProgrammeEvidenceRef | inherited through experiment | originating uncertainty | P0-P3 + gate + autonomy | taskId / experimentId / stateId |
| Expansion Proposal | local evidence refs | local epistemic enum | explicit uncertainty/limitations | risk + reversibility + gate | proposal/task refs |
| Opportunity Frontier | local evidence refs | local epistemic enum | explicit unknowns | risk + reversibility + gate | observationId / nextTaskId |
| Fleet Reflection | local evidence refs | local epistemic enum | uncertainty + open questions | risk + reversibility + gate | cycleId / findingId |
| Reality Delta | local evidence refs | local epistemic enum | new/resolved/persistent unknowns | risk + reversibility + gate | snapshot IDs / delta ID |

## Day 1 finding

The semantics are strongly aligned, but the representations are not yet one shared type system.

There are at least three families of repeated concepts:

1. **Evidence reference**
2. **Epistemic class**
3. **Risk / reversibility / human gate**

This does not automatically justify a shared global type. A premature "universal evidence model" could create coupling.

The safer hypothesis is:

> A thin composition boundary can preserve each kernel's local contract while carrying a provider-neutral provenance envelope around transitions.

## Proposed composition envelope

Conceptual fields only:

- transition id
- source kernel
- source object id
- target kernel
- target object id
- evidence references
- epistemic class before
- epistemic class after
- uncertainty carried forward
- risk
- reversible
- human gate required
- owner/authority
- createdAt

The envelope should not mutate either kernel's internal state.

## Critical invariant

A transition must never strengthen epistemic certainty merely because a downstream contract accepts the data.

Example:

`UNKNOWN → OpportunityFrontier` must remain UNKNOWN unless new evidence is explicitly attached.

Likewise:

`SPECULATIVE → Experiment` is still a hypothesis/experiment, not a fact.

## Evidence lineage

Prefer references over copying claims.

The system should be able to answer:

> Where did this downstream statement originate?

without pretending that provenance itself proves truth.

## Composition test vectors

### T1 — Real evidence

REAL source + evidence → downstream REAL is permitted only when the downstream contract's own evidence requirements are satisfied.

### T2 — Unknown

UNKNOWN + no new evidence → UNKNOWN remains UNKNOWN.

### T3 — Speculative

SPECULATIVE + experiment plan → EXPERIMENTAL/HYPOTHESIS state is permitted; REAL is not.

### T4 — Falsified

FALSIFIED result → uncertainty remains explicit; no automatic positive claim.

### T5 — Removed evidence

Reality Delta removed evidence → downstream interpretation must not claim the real-world object disappeared.

### T6 — High-risk action

High/critical or irreversible action → human gate remains required across every transition.

### T7 — Authority

AI-owned bounded work → cannot become merge/deploy/production authority through composition.

## Current conclusion

The evidence supports creating **an experiment around composition**, not yet a production composition framework.

That is why #88 is intentionally a research/verification task rather than another architecture commitment.
