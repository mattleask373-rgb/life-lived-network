# Agent System Status — 2026-10-20 (Phase 2 first consumer)

## SOURCE OF TRUTH

Repository evidence on `main`, GitHub Actions, open PRs, and canonical contracts are authoritative.
No autonomous production merge/deploy is active.

## PHASE 2 — GROUNDED MATCHING + FIRST CONSUMER

- **Foundation on main:** `src/lib/grounded-matching.ts` + tests + `docs/ai/grounded-matching.md`
- **First real consumer (2026-10-20):** `doSomethingToday` in `src/lib/intents.ts` now ranks via `groundedMatch` + `queryFromIntent`.
  - Public API (`WorldEntry[]`) unchanged — existing `DoSomethingToday` UI untouched.
  - Max three results, layer variety preserved.
  - Empty → empty array; UI quiet messaging unchanged.
  - Regression tests in `src/lib/intents.test.ts`.
- Pure, deterministic, evidence-backed. Never invents supply.
- **Does not** create a second discovery engine. `findSupply()` remains the sole possibility authority.
- **Does not** overwrite redesign visual tokens, cards or map work (#177).

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

1. Hosted Verify / CI on the exact head that contains the intents integration.
2. Optionally surface MatchEvidence in UI after #177 is reviewed.
3. Once WorkOpportunity lands on main, extend matcher input non-destructively.
4. Wire locality / service surfaces to the same MatchOutcome when design is ready.
