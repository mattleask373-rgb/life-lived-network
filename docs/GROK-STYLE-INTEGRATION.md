# Grok design integration playbook

**Purpose:** make the Grok redesign the intended user-facing experience while preserving the canonical Real World Atlas / Life Lived Network architecture, data truth, privacy, and backend contracts.

## Current baseline (2026-10-20)

- Canonical repository: `mattleask373-rgb/life-lived-network`.
- Current main baseline at this audit: `14e409e90a027305902f381de3d0a9fbd912dc71` (“Applied Grok redesign to home”).
- Lovable project `Real World Atlas` reports the same latest commit SHA. The linked project has therefore been confirmed to sync to the canonical repository; however, its recent commits reached `main` directly.
- **Safety blocker:** the repo owner must verify and enforce branch protection / PR-only integration before further Lovable code edits. The connected GitHub integration cannot read branch-protection settings (403). Until confirmed, use Lovable for read-only planning/screenshots only.
- Current main already contains the warm paper/cream/forest palette, Fraunces/Manrope fonts, a source-backed photo helper (`cardPhoto()`), neutral missing-photo state, and refreshed place-picker styling.
- The current clickable `EntryCard` still wraps block content in a native `button`. [PR #193](https://github.com/mattleask373-rgb/life-lived-network/pull/193) isolates the accessibility fix. Hosted Verify passed on exact head `503d8561db9de521fb6725e696d823d8765c261d` ([run #39438122965](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39438122965)); manual browser/screen-reader QA remains pending.
- Grok visual PRs #177 and #191 were based on stale `main` snapshots and overlap with newer implementation. Do not merge those stale branches over current main. #191 has been closed as superseded; #177 remains open while its useful documentation is migrated/reconciled.

## Product invariants

- One canonical place hierarchy and one canonical supply/discovery authority: `findSupply()`. Do not add a second matcher, ranker, recommender or parallel ingest path.
- Use current `WorldEntry`, Needs, service taxonomy, source/provenance and reviewed `WorkOpportunity` contracts. Never replace them with prototype data or mock routes.
- Never invent events, jobs, pay, availability, people, providers, photos, reviews or source claims. Unknown stays unknown; no photo uses a neutral placeholder.
- Preserve trust, source credit, freshness, demonstration labels, service/provider distinction, currency semantics, privacy routes and explicit empty/error states.
- No schema, RLS, grant, authentication, production data, source activation, credential or deployment change as a side effect of visual work.
- Human approval remains required for merge, production deployment, source rights, security policy, consequential data-contract changes and external side effects.

## Implementation sequence

| Slice | Scope | Must preserve | Acceptance |
|---|---|---|---|
| 0. Governance and baseline | Confirm canonical branch, protection rules, preview and Supabase target | PR-only workflow; no direct main edits | Required Verify and human approval rules are confirmed; target project identity documented |
| 1. Brand foundation | Tokens, typography, compass, shared surfaces | Current routes and semantic token meanings | Correct loaded fonts, contrast checked, focus remains visible, no route regression |
| 2. Entry cards + place picker | Photo-led card, source credit, honest fallback, search hierarchy and touch targets | `WorldEntry`, `cardPhoto()`, trust chips, currency helpers, canonical place index | Native/ARIA semantics are valid; keyboard and screen-reader tests; targets >=44px; no fake imagery |
| 3. Home/front door | Editorial hierarchy, primary action, locality context, filters, map/list switch | Existing data path and `findSupply()`; truthful counts | Empty/loading/error/retry states work; selected locality/context persists; no new discovery engine |
| 4. Detail sheet + map pins | Photo framing, card-to-detail flow, pin treatment | Real IDs, provenance, cancellation/freshness, map contracts | Correct record opens; map controls work by touch and keyboard; no guessed coordinates/ETAs |
| 5. Locality/service pages | Breadcrumbs, service-page visual system, quiet-state actions | Canonical URLs, server-rendered routes, service taxonomy, indexability/sitemap gate | Unknown slugs 404; empty/demo/stale/private pages do not become indexable; only real records count |
| 6. Needs + work opportunities | Consistent cards/forms and two-sided local actions | Needs model, reviewed `WorkOpportunity`, compensation/source/rights/policy/freshness fields | No parallel model; no invented pay or availability; unreviewed records stay unpublished |
| 7. Journey / Road Trip | Selected-place and itinerary visuals | Existing journey model, locality/corridor read, unavailable-provider state | Place/time/context survives; no guessed ETA or provider claims |
| 8. Account/profile | Forms and profile surfaces | Session, owner-scoped data, report/block/moderation/export/deletion semantics | No private-data flash before auth; access boundaries unchanged |

## Per-slice engineering process

1. Work from the latest `main` on an isolated branch. One writer owns each file during a slice.
2. Before editing, inspect current main, open PRs, tests and contracts; identify overlapping branches.
3. Keep the diff bounded. If the branch changes unexpectedly, stop and compare commits rather than overwriting.
4. Add focused behaviour tests and regression tests for the changed contract.
5. Require frozen-lockfile install, lint, tests and production build to pass on the exact PR head.
6. Manually check 375px and 1280px, keyboard-only navigation, visible focus, accessible names, contrast, reduced motion, long place names, loading/empty/error/retry states, and photo/source provenance.
7. Review quiet and busy localities. Empty data is a real state, not a prompt to create sample inventory.
8. Record changed files, exact commit, CI run, manual QA evidence, launch impact and any human decisions in the PR.
9. Human reviewer approves and merges. No agent auto-merges or deploys.

## Agent responsibilities

- **Grok:** proposes visual direction, screenshots and design refinements; does not author inventory or redefine domain contracts.
- **Lovable:** implements assigned UI work only after its branch is confirmed isolated and PR-only rules are enforced. Until then, read-only planning is acceptable; code edits are paused.
- **Codex/ChatGPT integration lane:** reconciles architecture/contracts, prepares bounded patches, regression tests and review evidence.
- **Human product owner:** chooses the design baseline and first pilot journey; confirms source rights, Supabase project identity and release decisions; reviews security-sensitive changes and approves merges/deployments.

## Current release gates / open work

- [ ] Repository owner confirms PR-required branch protection, required/current `Verify`, human approval, no bypass and no force-push/deletion. Current integration cannot inspect the protection settings.
- [ ] Complete manual 375px/1280px, keyboard and screen-reader QA for PR #193.
- [ ] Reconcile and close stale Grok visual PR #177 after this current playbook is accepted.
- [ ] Confirm whether Lovable's connected Supabase database is the project ref in `supabase/config.toml`; do not run migrations until resolved.
- [ ] Complete the sanitized default-ACL/grant review in [PR #194](https://github.com/mattleask373-rgb/life-lived-network/pull/194); no hosted grants or RLS changes without a separate explicit approval.
- [ ] Reconcile stale work-contract/surface/SEO branches #174, #176 and #173 onto current main in dependency order; verify exact heads and conflicts before merging.
- [ ] Complete current-main Verify and preview smoke tests before choosing a pilot release.

## Rollback

For a visual regression, revert only the relevant merged slice in a new reviewed PR. Do not restore an entire prototype archive or old backup branch, as that could erase newer data, route, privacy or security work. Database and production changes require their own reviewed rollback plan.
