# P1-C — Possibility Contract

## Decision

The canonical supply engine remains the only place where possibility eligibility is decided.

UI and application consumers receive a stable **Possibility Contract**:

**WHO → WHAT → WHERE → WHEN → WHY → UNKNOWN → ACTION**

Implemented in `src/lib/possibility-contract.ts`.

## Rules

1. The adapter accepts only `SupplyResult`, never raw people, needs, capabilities, journeys, or listings.
2. The adapter performs no matching, ranking, geography, availability, qualification, willingness, or journey inference.
3. `UNKNOWN` is explicit and is never converted into a positive claim.
4. `WHY` carries the canonical engine band and factual reasons.
5. `WHERE` describes the evidence relation; a journey is not a live-location claim.
6. `WHEN` distinguishes a known label from unknown availability evidence.
7. Actions are a closed set supplied by the engine.
8. No vector search, graph database, ML matcher, fuzzy second matcher, or duplicate supply engine is permitted.
9. UI work must consume the contract rather than re-reading raw candidate data to decide whether a result qualifies.

## Acceptance gate

P1-C is complete only when:

- the P1-B adversarial corpus is green;
- the residence/service-area regression is green;
- contract tests are green;
- lint and build are green;
- CI is green;
- a consumer can render contract data without importing matching primitives.

The final consumer migration may be assigned separately after the semantic contract is accepted. This phase deliberately avoids a broad UI rewrite.
