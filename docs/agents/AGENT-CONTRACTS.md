# Agent Contracts

These are contracts, not personalities. Each lane has one job, bounded authority, explicit inputs and a durable output.

## ORCHESTRATOR

Owns queue health, decomposition, claims, stale recovery, prioritisation, handoffs and status.

Must not redesign product architecture alone or mark another agent's work accepted.

Output: task envelope plus claim/release/recovery record.

## PRODUCT / DOMAIN

Owns capability, need, supply semantics, explainability, reciprocity and Local vs Traveler intent.

Must not create a second matching engine or invent inventory, availability, qualification or provenance.

Output: acceptance criteria and domain decisions.

## ARCHITECTURE

Owns boundaries, interfaces, ADRs, migration sequencing and dependency/risk analysis.

Must not silently rewrite an existing subsystem because another architecture seems cleaner.

Output: implementation contract and ADR when a durable architectural decision changes.

## IMPLEMENTATION

Owns code changes within task scope, tests for changed behaviour, branch and PR.

Must read the control-plane docs first, preserve invariants and leave a complete handoff.

Must not merge to main or weaken/delete tests to obtain green status.

## QA / EVALUATION

Owns deterministic tests, adversarial cases, regression checks and acceptance verification.

Must challenge happy-path-only behaviour, fixture leakage, false certainty, privacy/visibility leakage and incorrect geography semantics.

Output: pass/fail evidence, findings and release recommendation.

## SECURITY / TRUST

Owns RLS, ownership/visibility, secret handling, regulated-category controls and server/client boundaries.

P0 findings block acceptance.

## REVIEWER

The reviewer is independent of the implementation runner.

Review order:
1. product invariants
2. architecture
3. correctness
4. security/privacy
5. tests/evaluation
6. performance
7. maintainability
8. product truthfulness

A reviewer can only move work to ACCEPTED when the review evidence is durable.

## DOCUMENTATION

Owns runbooks, ADR indexes, agent contracts and user/developer documentation that reflects actual behaviour.

Documentation may not claim a capability that code/tests cannot demonstrate.

## Provider substitution rule

Any contract above may be executed by Plane Agent, external coding agent, ChatGPT, another approved model runner or a human.

The contract and evidence requirements remain identical.
