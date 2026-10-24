# Opportunity Frontier Contract

## Purpose

The Opportunity Frontier is a bounded observation seam for noticing where the current product model may not adequately represent reality.

It is deliberately **not** a second discovery engine.

It consumes evidence produced by existing canonical systems and records an observation that can become an experiment or ordinary bounded task after review.

## Canonical inputs

- `findSupply()` remains the sole supply/discovery authority.
- `src/lib/ingest/*` remains the sole external-world ingestion boundary.
- Existing supply-gap and provenance semantics remain authoritative.
- Programme and experiment contracts remain the authority for uncertainty and learning where those contracts are available.

## Observation fields

An observation records:

- scope and objective;
- observed supply state;
- source coverage;
- explicit unknowns;
- unmet need;
- candidate opportunity;
- evidence references;
- epistemic class;
- reversibility;
- risk;
- human-gate requirement;
- optional resulting task reference.

## Epistemic rules

`REAL` requires evidence.

`UNKNOWN` remains unknown and cannot silently become an execution claim.

`SPECULATIVE` and `IMAGINED` are exploration states, not execution authority.

The contract never upgrades an observation's epistemic class automatically.

## Safety

High/critical-risk or irreversible observations require a human gate.

No helper in this module:

- executes an experiment;
- selects a provider;
- claims a task;
- mutates ProgrammeState;
- mutates production;
- writes persistence;
- changes auth/RLS/schema;
- ranks or matches supply;
- creates embeddings/vector infrastructure;
- invents external-world facts;
- grants merge/deploy authority.

## Intended evolution

A later control-plane adapter may translate an evidence-backed, human-approved frontier observation into an ordinary bounded experiment or task.

That adapter must remain separate from discovery authority and must preserve epistemic state, evidence, risk and human gates.
