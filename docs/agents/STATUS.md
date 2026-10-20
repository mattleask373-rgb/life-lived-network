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

## CURRENT QUEUE — reconciled against main `14e409e90a027305902f381de3d0a9fbd912dc71`

### Design / accessibility
- Current main contains the newer Grok/Lovable front door. PRs #177, #191 and #192 are closed, unmerged, and superseded; do not revive those branches.
- **PR #193** is the focused current-main EntryCard accessibility fix. Latest native-overlay revision `75e998206a7c0535244f40a9ac7caae46f4fe8dc` is awaiting fresh Verify. Manual 375px/1280px, keyboard and screen-reader checks remain required.
- **PR #195** carries detail-sheet/map-control polish. Hosted Verify #39439225424 passed on recorded head `6624f7894c6ffd212683300f878c13bc46314312`; visual/keyboard/screen-reader QA remains open.

### Work contract / opportunity staging
- **PR #197** is the preferred current-main integration for WorkOpportunity contract, shared taxonomy, fixture-first Adzuna parser and staging bridge. Hosted Verify #39439428714 passed on exact head `1abc21d370fb93482760c60c57231c967e3e3d9a`.
- All Adzuna candidates remain staging-only, `review_required`, `canPublish: false`; no network activation, credentials, persistence, live inventory or schema/RLS/grant changes.
- PR #186's parser is carried forward by #197. #174 is the old-base contract branch; #187/#190 were merged into the feature branch, not into main. Avoid duplicate integration from those old branches.
- **PR #176** remains the intended public surface/request-path follow-up after the contract lands; its base is stale and it needs deliberate reconciliation. PR #188 is based on #176 and is not independently ready for main.

### SEO / locality
- **PR #173** contains the indexability gate, locality/service route, structured data and dynamic sitemap work, but its old-base branch also contains work-opportunity surface files. Hosted Verify #39427722990 passed on recorded head `94870d5b087f1939dbc4372588ee0be7f7f2e25f`; that is not evidence for a reconciled head.
- Current main does not yet contain the generic service + locality route or the shared dynamic indexability/sitemap gate. Reconcile SEO last, after the contract/surface dependencies, and run Verify on the final exact head.
- `findSupply()` remains the sole canonical discovery authority. Do not create a second matcher or allow taxonomy words to bypass work publication gates.

### Australian pilot / global readiness
- **PR #175** remains non-writing staging/validation. Hosted Verify #39427760586 passed on recorded head `bc4119e2aaaf323f1545e42052f5efad7bb7151f`, but its base is stale. Proposed Australian hierarchy and Queensland point candidates are not published; source rights, coordinates, hierarchy, timezone semantics and pilot scope remain human gates.
- **PR #178** is the updated read-only integration audit. **PR #196** is the current-main integration playbook; **PR #189** is an older-base phase plan.
- No proof is recorded here for production sitemap responses, Search Console indexing, live partner supply, signed-out enquiry capture, or complete manual accessibility QA.

### Canonical rules
- No autonomous merge or deploy.
- No fabricated inventory; quiet/unknown states remain honest.
- No production writes, schema/RLS/grant changes, secrets or feed activation without explicit human approval.
- No contact claim unless the real contact path has actually completed.
## 2026-10-20 — WorkOpportunity contract and Adzuna staging reconciliation

- A current-main integration branch is carrying the reviewed `WorkOpportunity` contract/taxonomy, fixture-first Adzuna parser, and parser-to-staging bridge onto the latest visual baseline. This remains pending exact-head CI and human review.
- All parsed/staged records remain review-required and unpublishable; no live network calls, credentials, source activation, persistence writes, public inventory, or schema/RLS/grant changes are introduced.
- Before any source activation, a human must verify Adzuna terms, attribution, retention/removal requirements, locality resolution, jurisdiction-specific work/volunteer/pay policy, and publication eligibility.
- Follow-up UI/SEO surfaces must be reconciled in dependency order against the current route tree; do not merge stale stacked PRs #173/#176 without conflict and exact-head verification.

