# Reality Delta Contract

## Purpose

The Reality Delta kernel is the smallest reusable primitive for answering:

**What is different now, and what evidence supports that claim?**

It compares two caller-supplied evidence snapshots for the same bounded scope and objective.

It does not discover supply, rank opportunities, infer demand, infer learner capability, fetch external data, execute actions, or decide that a change is true merely because a record disappeared.

## Position in the fleet loop

RECON -> evidence snapshots -> REALITY DELTA -> reflection/frontier/experiment -> bounded task -> human governance

The kernel is intentionally lower-level than Opportunity Frontier and Fleet Reflection so multiple lanes can consume the same change primitive without creating another authority.

## Epistemic discipline

Supported states are REAL, PLAUSIBLE, EXPERIMENTAL, SPECULATIVE, IMAGINED and UNKNOWN.

A REAL snapshot must contain explicit evidence. UNKNOWN remains unknown. If evidence disappears from a later snapshot, the delta records removed evidence and preserves uncertainty; it does not claim that the underlying real-world thing disappeared.

SPECULATIVE and IMAGINED deltas cannot silently become bounded execution actions.

## Evidence

Evidence is explicit and caller-supplied: stable id, source, claim, optional observation time and optional freshness.

Evidence identifiers must be unique within a snapshot. The kernel compares supplied evidence by id. It does not rank evidence or invent confidence.

## Bounded actions

A delta may carry an explicitly supplied next action: investigation, experiment or review. Actions are always bounded. High/critical risk or irreversible actions require a human gate. The kernel never executes the action.

## Architectural boundaries

The kernel MUST NOT:
- replace or modify findSupply()
- create another matcher/ranker/discovery engine
- add embeddings, vectors or speculative ML infrastructure
- add persistence, schema, RLS or auth
- add external providers
- mutate production
- merge or deploy autonomously
- invent inventory, availability, demand, learner capability or external-world facts
- silently accept architectural self-modification

## Design principle

**Creative freedom belongs in the hypothesis space. Evidence owns the claim. Governance owns authority.**
