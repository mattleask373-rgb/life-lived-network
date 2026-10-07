# AI Team Operating System

This repository is the proving ground for a **reusable AI development company**.

> Configure a project → activate a specialist team → continuously discover, research, build, test, document, measure and improve → route work → verify independently → human gates → integrate → learn.

## Layers

1. **Control plane** — claim/lease/heartbeat, state machine, transitions, execution evidence.
2. **Team OS** — roles, factory, bootstrap, routing, research boundary.
3. **Company OS (hour 5)** — capability registry, opportunities, work generation, agent health, human attention, provider degradation, org memory, evaluation schema.
4. **Project config** — isolated per `projectId`.
5. **Providers** — interchangeable; **execute DISABLED** until human activation.

## Continuous loop

```
MISSION → DISCOVERY → RESEARCH → OPPORTUNITIES → PRIORITISE
  → CANDIDATE WORK → ROLE ROUTING → PROVIDER POLICY → CLAIM
  → EXECUTE → EVIDENCE → INDEPENDENT VERIFY → HUMAN GATE
  → INTEGRATE → MEASURE → LEARN → NEXT WORK
```

## Human offline mode

Agents may continue: research, analysis, docs, tests, safe branch implementation, SEO analysis, backlog refinement, CI diagnosis.

Must queue: production deploy, external publish, major architecture, destructive migrations, security-sensitive decisions, financial actions, irreversible changes, merge to main.

Surface via `agent-human-attention.ts`.

## Machine-readable modules

| Module | Purpose |
|--------|---------|
| `agent-role-contract.ts` | Specialist roster |
| `agent-factory.ts` | Spawn specialist from template |
| `agent-project-bootstrap.ts` | Project A/B/C configuration |
| `agent-work-routing.ts` | Role eligibility + path collision |
| `agent-research-contract.ts` | KNOWN/INFERRED/PROPOSED/UNKNOWN |
| `agent-capability-registry.ts` | Fine capabilities + permissions |
| `agent-lifecycle.ts` | Instance lifecycle + health |
| `agent-opportunity.ts` | Opportunity pipeline |
| `agent-work-generator.ts` | Candidate work generation |
| `agent-human-attention.ts` | Human attention queue |
| `agent-provider-degradation.ts` | Provider failure policy |
| `agent-priority.ts` | Priority without safety bypass |
| `agent-org-memory.ts` | Durable organisational memory |
| `agent-evaluation-schema.ts` | Metrics schema only |
| `agent-state-machine.ts` | Task lifecycle |
| `agent-execution-contract.ts` | No silent done |
| `agent-provider.ts` | Provider-neutral selection |

## Anti-goals

- One generic autonomous agent
- Research → silent product requirements
- Self-approval
- Provider hard-wiring
- Retry forever / lower safety when degraded
- Fabricated telemetry
- Cross-project leakage
