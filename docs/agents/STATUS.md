# Agent System Status — 2026-10-07 (Hour 5 — Company OS)

## NORTH STAR

**AI company in a box:** configure project → activate specialist team → continuous discover/build/verify/learn under bounded autonomy + human gates.

## HOUR 5 IMPLEMENTED

| Module | Purpose |
|--------|---------|
| `agent-capability-registry.ts` | Role ≠ capability ≠ permission ≠ provider |
| `agent-lifecycle.ts` | Agent instance lifecycle + health |
| `agent-opportunity.ts` | SIGNAL→…→DECISION pipeline |
| `agent-work-generator.ts` | CandidateWork (never auto-requirement) |
| `agent-human-attention.ts` | Human offline decision queue |
| `agent-provider-degradation.ts` | Failure policy without retry storms |
| `agent-priority.ts` | Priority scoring; never waives safety |
| `agent-org-memory.ts` | Durable knowledge vs chat |
| `agent-evaluation-schema.ts` | Metrics schema (no fabricated data) |
| `agent-company-os.test.ts` | Pure organisational tests |
| `PROJECT-ISOLATION.md` | Cross-project boundary |

## VERIFIED / NOT VERIFIED / BLOCKED

| Item | Status |
|------|--------|
| Hour-5 pure modules + tests in repo | **IMPLEMENTED** |
| CI on latest head | **NOT VERIFIED** (recent Verify runs failing — likely lint; needs isolation) |
| Head Manager green head `2e9f873` | **VERIFIED** (historical) |
| Live Supabase / multi-project tenancy | **NOT VERIFIED** |
| Provider execute / prod webhook | **BLOCKED BY POLICY** |
| Fabricated metrics | **FORBIDDEN** (schema only) |

## DELIBERATELY DISABLED

- Provider `execute()`
- Production Plane webhook
- Autonomous main merge

## NEXT HIGHEST-VALUE WORK

1. Restore CI green on current head (format/lint).
2. Wire `projectId` into durable `agent_tasks` rows (migration + normaliser) — human-approved schema change.
3. Staging smoke of claim lifecycle.
4. Optional: adversarial role roster entries (red_team, skeptic) via factory.
5. Mission Control read model for Lovable (consume pure summaries only).

## SUGGESTED NEXT SPECIALIST

- **ChatGPT / QA:** CI isolation + adversarial review of hour-5 contracts.
- **Human:** staging smoke + decide when to persist opportunities/memory in Supabase.
