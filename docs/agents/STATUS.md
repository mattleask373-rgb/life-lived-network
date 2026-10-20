# Agent System Status — 2026-10-20 (Phase 2 integration spine)

## SOURCE OF TRUTH

Repository evidence on `main`, GitHub Actions, open PRs, and canonical contracts are authoritative.
No autonomous production merge/deploy is active.

## PHASE 2 — GROUNDED MATCHING FOUNDATION (NEW)

- **Landed on main (2026-10-20):** `src/lib/grounded-matching.ts` + tests + `docs/ai/grounded-matching.md`
- Pure, deterministic ranking of verified `WorldEntry` records only.
- Never invents supply. Explicit evidence on every match. Honest quiet-state + contribution invitation when sparse.
- Compatible with existing `intents.ts`, the redesign visual language (#177), locality pages, and future WorkOpportunity / Needs once #181–#190 bridges land.
- **Does not** create a second discovery engine. `findSupply()` remains the sole possibility authority.
- **Does not** overwrite any visual tokens, cards or map work from the redesign lane.
- Next: wire into surfaces after #177 review; extend input type when WorkOpportunity contract is merged.

## CURRENT QUEUE (condensed)

### Design / Redesign
- **PR #177** — Grok visual tokens, warm palette, photo-led cards, 44px place picker. Manual accessibility/visual QA still required before merge.

### Opportunity / Jobs path
- **#186** Adzuna parser (fixture-first)
- **#187 / #190** WorkOpportunity staging bridge
- Human gates: credentials, source rights, country coverage, compensation semantics.

### Phase 2 coordination
- **PR #189** — 24-hour global experience master plan (docs).

### Canonical rules still in force
- One discovery authority: `findSupply()`
- No fabricated inventory
- Quiet places stay honest
- Human gates for credentials, rights, RLS, production activation

## NEXT FOR THIS LANE

1. Keep grounded-matching pure and tested.
2. Coordinate with #177 so the redesign consumes the same MatchOutcome shape.
3. Once WorkOpportunity is reviewable on main, extend the matcher input non-destructively.
4. Support small-place + global hotspot readiness without special-case code.
