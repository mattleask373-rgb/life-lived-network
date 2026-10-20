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

## 2026-10-20 — WorkOpportunity contract and Adzuna staging reconciliation

- A current-main integration branch is carrying the reviewed `WorkOpportunity` contract/taxonomy, fixture-first Adzuna parser, and parser-to-staging bridge onto the latest visual baseline. This remains pending exact-head CI and human review.
- All parsed/staged records remain review-required and unpublishable; no live network calls, credentials, source activation, persistence writes, public inventory, or schema/RLS/grant changes are introduced.
- Before any source activation, a human must verify Adzuna terms, attribution, retention/removal requirements, locality resolution, jurisdiction-specific work/volunteer/pay policy, and publication eligibility.
- Follow-up UI/SEO surfaces must be reconciled in dependency order against the current route tree; do not merge stale stacked PRs #173/#176 without conflict and exact-head verification.

## 2026-10-20 — WorkOpportunity surfaces current-main integration

- Stacked follow-up branch carries locality/service and Need-prefill surfaces onto the current-main WorkOpportunity contract branch. This is a review candidate only; it is not merged.
- Reuses the existing service taxonomy, locality pages and Need model. Place context is resolved against canonical place records; unresolved places fail closed rather than silently selecting another locality.
- Opportunity cards preserve explicit engagement, compensation, source, rights, policy-review and publication-state semantics. Candidate records remain unpublishable until approved.
- No schema/RLS/grant changes, production writes, source activation, outbound contact, or deployment.
- Dependency order: merge/review the contract PR first, then review this stacked surface PR; reconcile the separate SEO/indexability work in #173 against the exact merged route tree.

