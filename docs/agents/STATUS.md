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


## 2026-10-20 — WorkOpportunity contract fresh port

- Fresh review branch `integration/work-opportunity-contract-2026-10-20` ports only the strict work-opportunity contract, taxonomy extension and explicit publication safeguards from #174 onto `main` at `14e409e90a027305902f381de3d0a9fbd912dc71`.
- The Adzuna parser/bridge files are intentionally excluded from this slice and remain a separate dependent staging integration; this branch makes no live source calls and creates no inventory.
- The contract preserves explicit engagement kind, pay status with integer minor units plus currency/basis, duration/dates, accommodation/transport/skills/conditions, provenance/source rights, freshness, jurisdiction/policy review and publication state.
- `findSupply()` remains the sole discovery authority. No DB/schema/RLS/grant changes, production writes, source activation or public opportunity publishing are included.
- Human review is still required for market-specific law/policy, source rights and any record publication. Australia remains NOT LIVE.


## 2026-10-20 — Adzuna staging bridge review

- Added an isolated follow-up branch `integration/adzuna-staging-bridge-2026-10-20` on top of the fresh WorkOpportunity contract port. It reuses the reviewed fixture-first parser/bridge files from #190 and compiles against the contract PR rather than the stale feature branch.
- This slice is pure parsing/composition and caller-supplied place resolution only: no live requests, credentials, persistence, scheduled refresh, Supabase changes or public inventory.
- All staged opportunities remain `canPublish: false` with unreviewed source rights, required policy review and unknown freshness; salary does not become public compensation without verified currency and basis.
- Hosted Verify and human legal/source-rights review are required. The source is NOT ACTIVE.
