# Expansion Proposal Contract (AI-NATIVE-01)

## Purpose

Provide the smallest executable seam for possibility expansion:

> The current category/workflow appears insufficient; here is an evidence-backed proposal, why the existing frame is inadequate, how to test it, and what human gate applies.

## Non-goals

- Not a second matcher / ranker / discovery engine
- Not automatic self-modification
- Not production mutation
- Not persistence / RLS / auth
- Not learner mastery inference
- Not fabricated external-world facts

## Lifecycle

`proposed → testing → accepted | rejected | superseded`

Acceptance produces an ordinary bounded task candidate only.

## Epistemic rules

- A proposal cannot be classified `REAL` (proposals are not facts)
- `UNKNOWN` cannot be accepted without evidence upgrade
- Irreversible or high/critical risk requires human gate

## Code

- `src/lib/expansion-proposal.ts`
- `src/lib/expansion-proposal.test.ts`
