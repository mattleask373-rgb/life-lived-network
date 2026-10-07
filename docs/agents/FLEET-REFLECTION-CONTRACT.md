# Fleet Reflection Kernel

## Purpose

The Fleet Reflection Kernel is the bounded learning seam for a creative development cycle.

It answers:

- What surprised us?
- Which assumption was challenged?
- What evidence supports the observation?
- What remains unknown?
- What should we investigate or experiment with next?
- What became possible that was not previously represented?

It records reflection; it does not execute the resulting idea.

## Position in the fleet loop

`RECON → TRIAGE → PRIORITISE → DECOMPOSE → ASSIGN → EXECUTE → VERIFY → EVALUATE → RECONCILE → LEARN → EXPAND → RECON`

The kernel sits at **LEARN** and produces bounded intent for the next loop.

## Epistemic discipline

Every finding has an explicit epistemic class:

- `REAL` — requires evidence.
- `PLAUSIBLE` — coherent interpretation, not established fact.
- `EXPERIMENTAL` — suitable for a bounded test.
- `SPECULATIVE` — useful possibility, not evidence.
- `IMAGINED` — creative possibility.
- `UNKNOWN` — deliberately unresolved.

The kernel never upgrades an idea into truth.

## Reflection finding

A finding records:

- cycle identity and observation;
- surprise and challenged assumption;
- evidence references;
- uncertainty and open questions;
- affected architecture/capability areas;
- reversibility and risk;
- human-gate requirement;
- optional bounded next action;
- disposition.

A `REAL` finding without evidence is invalid.

An `UNKNOWN` finding must preserve explicit uncertainty when it has no evidence.

High/critical risk or irreversible follow-up requires a human gate.

Speculative or imagined findings can lead to investigation/experimentation, but cannot silently become review authority.

## 24-hour cycle

A cycle is deliberately timeboxed. The kernel does not assume that a longer cycle is a better cycle.

At the end of a creative window, the fleet should be able to produce a compact reflection:

1. **Surprises** — observations that changed our understanding.
2. **Broken assumptions** — beliefs the work challenged.
3. **New possibilities** — ideas worth testing.
4. **Unknowns** — things we still cannot claim.
5. **Experiments** — bounded ways to learn.
6. **Architecture pressure** — abstractions that may be becoming obsolete.
7. **Next actions** — ordinary bounded work only.

## Safety boundary

This module has no authority to:

- execute work;
- mutate Programme State;
- modify production;
- authenticate agents;
- persist control-plane state;
- select providers;
- merge or deploy;
- modify `findSupply()`;
- create a second matcher, ranker, recommender, or discovery engine;
- infer learner mastery;
- invent external-world facts;
- accept self-modification.

The output is evidence-backed reflection and bounded intent. Existing control-plane, human approval and integration gates remain authoritative.

## Design principle

**Full creative freedom belongs in the hypothesis space.**

**Authority belongs in the evidence and governance layer.**

That separation lets the fleet be genuinely imaginative without confusing imagination with reality.
