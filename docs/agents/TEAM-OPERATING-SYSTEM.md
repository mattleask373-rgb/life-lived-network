# AI Team Operating System

This repository is the first proving ground for a **reusable AI development organisation**.

> Configure a project → the same specialist team operates → evidence in GitHub → humans gate consequential actions.

## Layers

1. **Control plane** — claim/lease/heartbeat, state machine, transitions, execution evidence (`src/lib/agent-*`, migrations).
2. **Team OS** — role contracts, factory, bootstrap, routing, research boundary (this doc + machine-readable modules).
3. **Project config** — per-repo identity, risk, providers, enabled roles (`bootstrapProject`).
4. **Providers** — interchangeable runners; **execute adapters DISABLED** until human activation.

## Continuous loops (bounded autonomy)

```
DISCOVER → PRIORITISE → DECOMPOSE → CLAIM → EXECUTE → VERIFY → REVIEW → ACCEPT → INTEGRATE → OBSERVE → LEARN
```

Parallel lanes: engineering, research, SEO, marketing, product, reliability.

Agents may continue useful work inside leases, scopes, budgets and policies **without** waiting for humans on every micro-task.

Humans remain mandatory for: main merge, production deploy/secrets, destructive migrations, architecture/privacy invariant changes, regulated behaviour, external publication, paid spend, irreversible ops.

## Machine-readable modules

| Module | Purpose |
|--------|---------|
| `agent-role-contract.ts` | Specialist roster |
| `agent-factory.ts` | Spawn new specialist from template |
| `agent-project-bootstrap.ts` | Project A/B/C configuration |
| `agent-work-routing.ts` | Role eligibility + path collision |
| `agent-research-contract.ts` | KNOWN/INFERRED/PROPOSED/UNKNOWN |
| `agent-state-machine.ts` | Lifecycle transitions |
| `agent-execution-contract.ts` | No silent done / no self-approve |
| `agent-provider.ts` | Provider-neutral selection |

## Anti-goals

- One generic “AI agent” does everything
- Research silently becomes product requirements
- Implementer self-accepts
- Provider hard-wiring (role ≠ vendor)
- 24/7 autonomy that bypasses human gates
