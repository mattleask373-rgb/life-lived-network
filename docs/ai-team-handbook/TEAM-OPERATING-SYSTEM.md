# AI Team Operating System

## Purpose

Turn the Life Lived agent control plane into a reusable, provider-neutral operating system for a continuous team of specialised AI agents.

The reusable product is the **team system**:

- role contracts
- routing policy
- evidence rules
- handoffs
- autonomy boundaries
- collision avoidance
- recovery
- observability
- human gates
- project bootstrap

A project supplies the workload and configuration.

## Continuous operating loop

DISCOVER → PRIORITISE → DECOMPOSE → ROUTE → CLAIM → EXECUTE → VERIFY → REVIEW → ACCEPT → HUMAN GATE → INTEGRATE → OBSERVE → LEARN → DISCOVER

No transition is proof by itself. Evidence is required.

## Team topology

| Lane | Owns | Typical outputs | Independent check |
|---|---|---|---|
| Manager | queue, routing, dependencies, recovery | task plan, routing decision | control-plane invariants |
| Product | objectives, requirements, opportunities | product proposal | human/product decision |
| Architecture | boundaries, interfaces, ADRs | architecture decision | challenger/security |
| Engineering | implementation | branch/PR/tests | independent QA/review |
| QA | verification | test/evidence report | separate from implementer |
| Security | security/privacy boundaries | threat review/findings | human for material changes |
| Research | evidence and intelligence | sourced finding | source/provenance check |
| SEO | search opportunity/quality | SEO brief/recommendation | evidence + content/technical review |
| Marketing | positioning/growth hypotheses | campaign/asset proposal | human gate for external action |
| UX | flows/accessibility/design | UX/design handoff | visual/accessibility review |
| Docs | durable knowledge | handbook/ADR/runbook | owner review |
| DevOps | CI/release readiness | release evidence | human for production |
| Analytics | measurement/learning | KPI/experiment report | telemetry source check |
| Agent Factory | new roles/contracts | tested lane definition | architecture/security |

Roles are capability contracts, not permanent model assignments.

## Autonomy envelope

### Low-risk autonomous work

Agents may continue without per-task human interruption when policy permits:

- research
- code analysis
- test creation
- documentation
- non-destructive refactoring
- SEO analysis
- draft content
- issue decomposition
- CI diagnosis
- evidence collection

### Human-gated work

Human approval remains mandatory for:

- protected main merge
- production deployment
- production secrets
- destructive migrations
- material architecture changes
- security/privacy boundary changes
- regulated/high-impact behaviour
- external publication
- financial spend
- irreversible external actions
- decisions that promote insufficient evidence into product truth

## Provider neutrality

A provider is selected from a role's capability contract using policy:

role + task type + risk + autonomy + capability + availability + cost + latency + permissions.

The same role may be fulfilled by different providers on different tasks.

Provider identity never changes product truth, evidence requirements or human gates.

## Evidence states

Use:

- VERIFIED
- PARTIALLY VERIFIED
- NOT VERIFIED
- BLOCKED
- SIMULATED

Never use a successful workflow state as a substitute for evidence.

## Durable handoff

Every completed or interrupted task leaves:

task_id, objective, owner, scope, files/areas, work completed, evidence, tests, assumptions, uncertainties, blockers, risks, reviewer, next owner, next action.

The receiving agent must be able to continue without reconstructing the original conversation.

## Parallelism

Parallel work is preferred when scopes are separable.

Serialise work when agents share:

- the same migration
- the same canonical contract
- the same protected files
- the same production environment
- conflicting product semantics
- overlapping active leases
- a dependency that makes parallel execution unsafe

## Recovery

Failure preserves work.

STALE → inspect preserved branch/evidence → fresh lease → continue, abandon, or re-scope.

Repeated failure using the same approach becomes a diagnosis task rather than an infinite retry loop.

## Golden rule

No AI agent may silently promote an assumption, possibility, recommendation, or unverified result into confirmed product truth.
