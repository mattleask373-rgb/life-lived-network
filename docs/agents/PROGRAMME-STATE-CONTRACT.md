# Programme State Contract

**Status:** Canonical bounded contract for AI-NATIVE-02

The Programme OS state is the smallest durable representation of what the programme currently knows and what it proposes doing next.

## State

The state contains:

- objective and constraints;
- current project state;
- evidence-backed capability needs;
- frontier signals;
- epistemically classified claims;
- explicit uncertainties;
- bounded next actions;
- lifecycle status.

## Epistemic classes

Every consequential claim or frontier signal must use one of:

- `REAL` — supported by evidence;
- `PLAUSIBLE` — meaningful supporting evidence exists, but not demonstrated;
- `EXPERIMENTAL` — currently being tested;
- `SPECULATIVE` — conceivable with weak evidence;
- `IMAGINED` — creative possibility without a truth claim;
- `UNKNOWN` — insufficient evidence to classify as known.

`UNKNOWN` is first-class. It must never be silently converted into a positive claim.

## State updates

A state update records:

- state ID;
- timestamp;
- changed fields;
- reason;
- evidence references;
- epistemic classification.

The state ID is stable across updates. Updates must explain what changed and why.

## Bounded actions

Every next action is a candidate task, not an instruction to execute autonomously. It must declare:

- owner;
- risk;
- human-gate requirement;
- acceptance criteria;
- bounded scope.

Critical actions require human approval. High/critical-risk work may not be silently delegated to an autonomous AI owner.

## Explicit non-goals

This contract does **not**:

- infer learner mastery;
- create a capability graph database;
- create a recommendation or matching engine;
- store embeddings;
- mutate production state;
- grant agent execution authority;
- change auth/RLS/schema;
- accept self-modification proposals;
- replace the Living World `findSupply()` authority.

The next phase may consume this state through the existing durable agent control plane, but this module itself has no execution side effects.