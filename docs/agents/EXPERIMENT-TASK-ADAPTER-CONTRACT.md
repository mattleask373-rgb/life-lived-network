# AI-NATIVE-04 — Experiment Task Adapter Contract

## Purpose

Translate an explicitly accepted and already-validated ExperimentPlan into an ordinary bounded provider-neutral task envelope.

This module is a translation boundary. It does not execute experiments, accept experiments, mutate ProgrammeState, claim work, select a provider, or grant autonomy.

## Input

- validated ExperimentPlan;
- explicit acceptance disposition;
- ProgrammeState reference containing the originating state and uncertainty;
- task identity.

The adapter rejects any disposition other than accepted.

## Output

A bounded task envelope carrying originating ProgrammeState and uncertainty, hypothesis and experiment references, question and bounded procedure, inputs/evidence requirements, expected observations, success/failure criteria, reversibility, risk and human-gate requirement, owner, explicit scope-in/scope-out, and no provider-specific execution choice.

The output uses the existing provider-neutral orchestration vocabulary (IMPLEMENTATION, risk class, acceptance criteria, invariants, evidence requirements) so it can enter the ordinary control-plane queue without creating a parallel execution system.

## Safety invariants

1. Acceptance is an input fact from an existing human/control-plane disposition; this adapter never creates acceptance.
2. high, critical, or irreversible experiments always retain a human gate.
3. The adapter never mutates the supplied plan or ProgrammeState.
4. The adapter never invokes providers, GitHub, databases, webhooks, or external side effects.
5. Uncertainty and evidence references are copied, not upgraded.
6. Provider selection remains auto / downstream policy.
7. The task is explicitly bounded to the experiment procedure and its evaluation criteria.
8. No matcher, ranker, recommendation, discovery, vector, embedding, persistence, auth, or RLS layer is introduced.

## Risk mapping

- low → P3
- medium → P2
- high → P1
- critical → P0

Irreversibility adds a human gate regardless of numeric risk.

## Ownership

Experiment ownership is preserved as task metadata. It is not converted into provider authority.

- human → human owner
- ai → AI owner, still subject to task/control-plane policy
- human_ai → shared owner
- software → software owner

This module cannot grant merge, deploy, production, secret, financial, or external-publish permissions.

## Non-goals

No execution adapter, scheduler, persistence, schema migration, provider integration, autonomous acceptance, autonomous merge/deploy, or ProgrammeState mutation is part of this slice.
