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

## 2026-10-20 — SEO indexability and sitemap current-main integration

- Stacked SEO gate work is being reconciled after the WorkOpportunity contract and locality/service surface slices. This branch is review-only until the preceding contract/surface PRs are approved and merged.
- Locality/service indexability, structured data and sitemap enumeration share a single eligibility policy; empty, demonstration, stale, private, rights-restricted or blocked pages must not become indexable.
- Sitemap routes enumerate only approved canonical page candidates; unknown place/service slugs must not generate doorway pages.
- `robots.txt` is crawler guidance, not an access-control boundary. Private-route access remains enforced by auth/RLS/server boundaries.
- No new inventory, schema/RLS/grant change, source activation, production write or deployment is included.
- Require tests for page metadata and sitemap inclusion/exclusion to use the same gate; verify served HTML and sitemap on preview before launch.

## 2026-10-20 — Quiet service Need handoff

- Adds a “Looking for help?” action to quiet service pages that carries the canonical service and locality into an editable Need draft.
- The Need page resolves the requested place slug against the real place source. If it cannot resolve, it explains the failure and does not silently fall back to the user's default locality.
- Query values are bounded draft prefill only; they are not persisted facts and do not create a Need until the signed-in user explicitly submits.
- No schema/RLS/grant change, production write, outbound contact, source activation or deployment. Manual end-to-end click-through remains required.

