# Living World — Agent Control Plane (Phase 4/5)

This directory is the durable, repository-resident control plane for multi-agent development.

**Source of truth order**
1. Repository code + tests
2. This control-plane documentation + task records
3. GitHub Issues / PRs / labels / comments
4. ADRs in `docs/adr/`
5. Agent statements (never authoritative alone)

**Non-negotiables**
- No second possibility / matching engine. Canonical engine remains `src/lib/supply-engine.ts`.
- No autonomous merge to `main`.
- No force-push or history rewrite (Lovable constraint + safety).
- Capability ≠ willingness ≠ availability; Journey ≠ availability; Living-in ≠ Serves; Unknown ≠ Yes.
- Agents accelerate the product; they are not the source of truth for people, needs, geography, trust, or consent.

**Autonomy levels** (Phase 5)
- L0 Inspect only
- L1 Propose tasks
- L2 Implement on branch
- L3 Verify + open PR
- L4 Low-risk maintenance under explicit policy
- L5 Future human-approved automation
None of the levels grant autonomous merge to main.

See:
- `STATE-MACHINE.md` — lifecycle + transitions
- `CLAIM-LEASE-HEARTBEAT.md` — ownership protocol
- `HANDOFF.md` — required handoff format
- `SPECIALIST-LANES.md` — ownership boundaries
- `OBSERVABILITY.md` — status & metrics
- `INVARIANTS.md` — hard failure conditions
- `../adr/` — architecture decision records
