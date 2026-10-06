# Living World — Continuous AI Engineering Operations

## Purpose

Living World uses AI agents to accelerate engineering without making unsupported claims,
weakening security, or giving autonomous agents production authority.

The durable source of truth is the repository, Git history, GitHub issues and pull
requests, CI evidence, tests, evaluation results, and documented product contracts.

## Operating loop

RECON → TRIAGE → DECOMPOSE → ASSIGN → MONITOR → EVALUATE → RECONCILE → PREPARE REVIEW → LEARN → REPEAT

### RECON
Read current `main`, open issues, open PRs, recent commits, CI status, and relevant
tests/docs.

Output: verified repository state.

### TRIAGE
Classify work by urgency, dependency, risk, and whether it is implementation,
evaluation, diagnosis, or human decision work.

Output: bounded candidate tasks.

### DECOMPOSE
Every task must state:
- task
- owner
- scope
- non-goals
- dependencies
- acceptance criteria
- tests
- security constraints
- expected evidence
- escalation conditions

Output: independently executable task.

### ASSIGN
Give a task to one implementation owner. Parallelize only isolated work.

Never parallelize competing edits to the same domain kernel, migration, RLS/security
boundary, or semantic contract.

### MONITOR
Track branch, commits, CI, failures, and stated limitations.

No progress claim is accepted without repository evidence.

### EVALUATE
Check implementation against the task and adversarially challenge its assumptions.

Classify findings as:

REAL / PARTIAL / PROPOSED / MISSING / CONFLICTING / UNKNOWN

### RECONCILE
Compare implementation against current `main`, existing architecture, tests, and
product contracts.

Duplicate implementations are removed or reconciled rather than allowed to coexist.

### PREPARE REVIEW
A task is READY FOR HUMAN only when:
- acceptance criteria are met
- tests pass
- lint passes
- build passes
- CI evidence is available
- security/schema impact is stated
- unresolved ambiguity is explicitly listed

### LEARN
Every important bug becomes a regression test where practical.
Repeated failure becomes a diagnosis task.

Then repeat.

## Agent handoff contract

Every agent completion must report:

CURRENT STATE
COMPLETED
IN PROGRESS
BLOCKED
CONFLICTS
FILES CHANGED
TESTS RUN
TEST RESULT
LINT RESULT
BUILD RESULT
CI RESULT
SECURITY IMPACT
SCHEMA/MIGRATION IMPACT
KNOWN LIMITATIONS
OPEN QUESTIONS
READY FOR HUMAN
NEXT THREE TASKS
DO NOT REPEAT

Claims without evidence are UNVERIFIED.

## Failure policy

THREE ATTEMPTS → STOP → DIAGNOSE.

A repeated failure must not produce an endless retry loop.

The diagnosis records:
- exact failure
- attempts made
- evidence
- suspected cause
- unresolved question
- recommended decision

## Non-negotiable boundaries

Agents must not autonomously:
- merge production changes
- weaken RLS or authentication
- bypass CI
- expose secrets
- rewrite Git history
- make destructive production changes
- silently alter privacy semantics
- invent capability, willingness, availability, journey, qualification, or location facts
- create a second matching engine

Human approval is required for irreversible, security-sensitive, production, or
ambiguous semantic decisions.

## Domain invariants

CAPABILITY ≠ WILLINGNESS

CAPABILITY ≠ AVAILABILITY

JOURNEY ≠ AVAILABILITY

LIVING IN A PLACE ≠ SERVING A PLACE

SELECTING A PLACE ≠ TRAVELLING THROUGH IT

UNKNOWN ≠ YES

The canonical deterministic supply engine is the sole matching engine.

## Branch convention

Use:

`agent/<owner>/<phase>-<short-task>`

Examples:

`agent/lovable/p1a-env-hygiene`

`agent/chatgpt/p1b-supply-adversarial-eval`

A branch must have one clear purpose.

## Human gate

Human approval remains required for:
- production merges
- security weakening
- destructive operations
- credential rotation
- schema changes with material semantic impact
- unresolved product semantics
- release decisions

## What continuous operation means

Continuous operation means the system can repeatedly discover work, assign bounded
tasks to capable agents, validate results, record evidence, and escalate decisions.

It does **not** mean autonomous production deployment.

A coding agent may create or update a branch and pull request, but the integrator must
review the evidence and the human controls final merge/release authority.

## Current Phase 6 priority

P1-A environment hygiene
→ P1-B adversarial supply evaluation
→ P1-C Possibility Contract
→ P1-D full operationalization
→ P2 progressive need structuring

Operational documentation can be prepared in parallel, but it must not bypass the
semantic gates above.
