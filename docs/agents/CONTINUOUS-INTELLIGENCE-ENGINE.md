# Continuous Intelligence Engine

Status: EXPERIMENTAL frontier architecture
Authority: human-controlled repository gates remain authoritative

## Thesis

The system should evolve from a collection of AI-native kernels into a **living intelligence substrate**.

The substrate continuously converts reality into evidence, evidence into bounded decisions, decisions into fenced experiments, experiments into verified reality changes, and those changes into better future decisions.

The goal is not maximum autonomous activity.

The goal is **maximum verified learning and decision quality per unit of time while preserving authority, safety, provenance and human control**.

## The compounding loop

```
REALITY
  ↓
OBSERVE
  ↓
EVIDENCE + PROVENANCE
  ↓
MODEL + UNCERTAINTY
  ↓
OPPORTUNITY FRONTIER
  ↓
HYPOTHESIS
  ↓
EXPERIMENT DESIGN
  ↓
AUTHORITY / SCOPE CHECK
  ↓
FENCED EXECUTION ATTEMPT
  ↓
EVIDENCE
  ↓
INDEPENDENT VERIFICATION
  ↓
REALITY DELTA
  ↓
MODEL / FRONTIER UPDATE
  ↓
NEXT BEST QUESTION
  ↺
```

This loop is deliberately larger than an agent.

An individual model is a replaceable reasoning component. The durable intelligence is the causal memory connecting observations, decisions, actions, outcomes and learning.

## Intelligence Cycle

A cycle is the smallest unit of compounding intelligence.

It must preserve a causal chain across:

- observation/evidence identity;
- epistemic class;
- uncertainty;
- opportunity identity;
- hypothesis identity;
- experiment identity;
- task identity;
- authenticated actor/run;
- tenant/project scope;
- lease generation/fencing token;
- execution attempt;
- provider identity and capabilities;
- produced evidence;
- independent verification;
- reality delta;
- resulting model/frontier update;
- next-cycle decision.

The system should be able to reconstruct:

> why this action happened, what evidence justified it, who or what was authorized, what actually happened, what was independently verified, what changed in reality, and why the next action was selected.

## Intelligence economics

Prefer cycles with high expected value of information and high decision impact.

A candidate policy may begin with:

`score = information_gain × decision_impact × reversibility / cost`

Then apply explicit penalties for:

- risk;
- uncertainty;
- stale evidence;
- dependency fragility;
- provider concentration;
- irreversible side effects;
- missing approval;
- weak verification;
- low expected reuse of evidence.

The formula is experimental. It must itself be evaluated against outcomes.

## Frontier expansion

The engine should actively search for four kinds of frontier:

### Knowledge frontier
Important unknowns that can be cheaply falsified.

### Capability frontier
New things the system could safely do if verified.

### Opportunity frontier
Real-world possibilities with meaningful expected value.

### Architecture frontier
Bottlenecks whose removal unlocks many downstream capabilities.

A high-value discovery is one that changes the reachable set of future possibilities, not merely one that adds another feature.

## Deliberate disagreement

The intelligence substrate should maintain competing hypotheses when evidence is ambiguous.

For consequential decisions:

- preserve disagreement;
- identify assumptions;
- request independent review when valuable;
- design discriminating experiments;
- avoid consensus-by-repetition;
- never promote confidence because multiple providers repeated the same unsupported claim.

Provider diversity is evidence diversity only when the underlying information paths are meaningfully independent.

## Epistemic firewall

No component may silently upgrade:

`UNKNOWN → PLAUSIBLE → SUPPORTED → VERIFIED/REAL`

without the evidence required by the target state.

Execution output is evidence.

Verification is a separate authority boundary.

A contradicted or withdrawn observation remains part of history and can trigger re-evaluation of downstream conclusions.

## Authority firewall

The engine can propose broadly but execute narrowly.

Allowed intelligence actions include:

- generate hypotheses;
- rank opportunities;
- propose experiments;
- propose architecture changes;
- propose provider routing changes;
- discover deletion candidates;
- design verification strategies;
- identify contradictions;
- identify missing evidence;
- schedule the next question.

Protected actions remain human-gated:

- production deployment;
- protected merge;
- credential/secret escalation;
- security-policy weakening;
- RLS weakening;
- irreversible destructive actions;
- changes to the safety/approval policy itself.

## Continuous operation

A scheduler is a wake-up mechanism, not the system's memory.

The durable loop is:

1. wake;
2. reconcile events;
3. inspect persisted state;
4. recover stale work using fencing;
5. select the next bounded cycle;
6. establish execution authority;
7. execute;
8. persist evidence;
9. independently verify;
10. update reality state;
11. update the opportunity frontier;
12. record learning;
13. schedule the next best question;
14. sleep.

The loop must be restart-safe at every boundary.

## Provider independence

Models and providers are interchangeable reasoning/acting components.

The substrate owns:

- memory;
- provenance;
- epistemics;
- authority;
- task state;
- evidence;
- verification;
- learning history;
- opportunity ranking.

A provider may fail, disappear, disagree, improve or be replaced without destroying the intelligence substrate.

## Self-improvement boundary

The system may propose changes to itself.

It may not silently authorize those changes.

Self-improvement therefore follows:

`discover → propose → evaluate → human gate → integrate → observe → verify`

not:

`discover → rewrite safety → deploy`

## First proof slice

Build a provider-neutral pure/in-memory fixture across existing kernels:

Reality Delta → Opportunity Frontier → Expansion Proposal → ProgrammeState → Experiment Plan → bounded Experiment Task → Fleet Reflection → Reality Delta.

Preserve a thin provenance/authority envelope at each transition.

Do not prematurely replace the existing local kernel contracts with a universal type.

## Adversarial proof suite

At minimum:

- stale evidence;
- UNKNOWN evidence;
- contradicted evidence;
- removed evidence;
- replayed event;
- duplicate attempt;
- duplicate completion;
- stale lease generation;
- cross-scope actor;
- forged actor text;
- wrong execution attempt attached to evidence;
- verification of a different attempt;
- incapable provider;
- human-required task routed to non-human provider;
- reviewer self-approval;
- provider disappearance;
- scheduler restart;
- partial failure between evidence and transition.

Every failure must fail closed without destroying the audit trail.

## Ultimate success condition

The system has crossed the frontier when a restartable, provider-neutral loop can continuously discover high-value questions, safely test them, verify reality, preserve uncertainty, and improve the next decision — while remaining unable to bypass its own authority boundaries.

The result is not an autonomous agent.

It is a **compounding intelligence substrate**.

## Explicit non-goals

- no autonomous merge;
- no autonomous production deployment;
- no credential escalation;
- no RLS/security weakening;
- no removal of human gates;
- no second repository;
- no second control plane;
- no fabricated capability claims.

All frontier claims remain hypotheses until demonstrated by evidence.
