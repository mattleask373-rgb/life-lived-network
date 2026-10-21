# Agent System Status — 2026-10-21 (Grok redesign integration / global integration phase)

## Canonical baseline

- Repository: mattleask373-rgb/life-lived-network
- Current main SHA checked via GitHub: `8d79247991187bf64813cf72e3ec75aeb508e2e9` (latest observed 2026-10-21 00:23:29 UTC).
- Since the earlier `006a98c...` baseline, three commits (`fea27ff`, `8801a50`, `30c2877`) improved PlacePicker/PlaceSearch, then three more (`eb54b10`, `9c4a9e9`, `8d79247`) added an explicitly unavailable “Ask about this place” placeholder and its no-answer contract/test to the locality page. It remains a disabled placeholder, not an active assistant endpoint.
- **Verified governance concern:** ruleset [#24946178](https://github.com/mattleask373-rgb/life-lived-network/rules/24946178), “living World - protect main”, reads `enforcement: disabled`. The branch-protection endpoint returned 403 to this connector, so any separate legacy protection cannot be confirmed. Have a repository administrator verify and enable the intended required PR/review/Verify controls. The Lovable snapshot equals current main, but the actual Project Settings → Git sync destination still cannot be proven from that fact; confirm it targets a non-main branch before any more editor writes.
- No autonomous merge/deploy is authorised. Production data, schema, RLS/grants, secrets and live source activation remain human-gated.

## Foundation confirmed on main

- Canonical place model and hierarchy: src/lib/places.ts and server-side place/locality functions.
- Shared service taxonomy: src/lib/service-taxonomy.ts.
- Single possibility/discovery authority: findSupply() in src/lib/supply-engine.ts.
- Deterministic evidence-based ranking seam: src/lib/grounded-matching.ts; doSomethingToday uses it through src/lib/intents.ts.
- Public listing retrieval and normalisation: src/lib/world.functions.ts and src/lib/listings.ts.
- Generic locality route and generic service-locality route exist on main. The remaining SEO task is to reconcile the explicit fail-closed indexability gate and ensure page metadata and sitemap enumeration use the same decision.
- Existing AI draft assistant: src/lib/draft-assist.functions.ts and src/lib/draft-assist.server.ts. It is signed-in, schema-bounded and saves no draft automatically.
- A disabled “Ask about this place” placeholder and an always-unavailable state contract now exist on the locality page. They make no model call and carry no answer; no active read-only assistant endpoint is confirmed. Grounded matching is not an LLM assistant.
- Australia is not live. No rights-cleared pilot inventory should be implied by staging work.

## Design direction

- The Grok-inspired visual direction is being implemented in the canonical application; do not rebuild a second frontend or restore old branches wholesale.
- Current main includes the Grok-inspired home redesign. Extend the current component system surface-by-surface.
- Lovable remains an editing/sync path, not authority for domain contracts. GitHub main, reviewed changes and tests are the integration source of truth.
- Draft PR #211 (`integration/grok-redesign-ui-current-main-2026-10-21`, latest head `e7b732d25cd951f3ab3c1007257442563e361336`) is the design/accessibility foundation. Its newest commit adds a source-checkpoint note only; exact-head Verify passed in [run #39520719116](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39520719116). It remains based on older `006a98c...` ancestry and needs reconciliation against current main `8d792479...`, plus manual visual, keyboard, screen-reader and photo QA.
- Draft PR #220 (`integration/grok-map-list-sync-main-2026-10-21`, head `e8fd148fa0223707fd317b80b19a47944c0bf1a2`) was based on `30c2877...`; exact-head Verify passed in [run #39520945717](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39520945717): 45 test files / 342 tests, lint 0 errors / 7 warnings, production build succeeded. Main subsequently advanced three commits touching only AskThisPlace/locality paths, not the changed home route/helper/test. It remains draft and GitHub reports mergeable, but bring the PR merge result/current head up to date and rerun exact-head Verify before review/merge.
- PR #216 is closed unmerged as superseded. Its prior Verify passed, but it was stacked on a moving parent; use #220 only as the map/list review target.
- Draft PR #213 (`integration/grok-traveller-current-main-2026-10-21-v2`, head `ed04b8c3778b87b60739625043033f5fd1e84d0f`) covers Journey/Road Trip only. Its exact-head Verify passed in [run #39519664036](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39519664036) on the previous parent head; retarget/reconcile and rerun Verify after #211's current parent state is settled. Manual QA remains.
- PR #212 is the historical Journey/Road Trip branch with a Prettier/lint failure in [run #39519498330](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39519498330); tests/build were skipped. Treat it as superseded by #213.
- PR #210 is the open documentation-only handoff draft. It now includes the parity matrix, current PR/CI status, source provenance caveat and this status snapshot. This docs PR is based on the older `006a98c...` main ancestor and requires review/base reconciliation before any human merge.

## Active integration queue (snapshot; verify each head before acting)

### Design / accessibility
- #211 — Grok design/accessibility foundation, draft; latest head Verify passed, old base ancestry, manual QA pending.
- #220 — map/list synchronization directly based on current main; draft, exact-head Verify passed, manual QA pending.
- #216 — closed unmerged as superseded by #220.
- #213 — Journey/Road Trip styling; draft, Verify passed before the latest #211 parent commit; reconcile and rerun Verify.
- #212 — previous Journey/Road Trip candidate with lint failure; superseded by #213.
- #210 — shared redesign handoff and status snapshot; documentation-only draft.
- The old #211/#213 stack and documentation PR #210 still descend from `006a98c...` while current main is `30c2877...`; the three main-side commits touch PlacePicker/PlaceSearch only. #220 is based directly on current main and has no #211 dependency. Do not retarget stacked PRs blindly; reconcile their base and rerun exact-head Verify.

### WorkOpportunity / ingestion
- #203 — reviewed WorkOpportunity contract ported onto current main; current-main base, draft. Candidate contract branch.
- #204 — Adzuna staging bridge stacked on #203. Staging only; no live feed or credentials.
- #206 — work-opportunity surfaces stacked on #203. Review against the contract and the canonical findSupply() path.
- #197 and #205, plus #199, are competing/older work-opportunity branches. Do not merge multiple implementations of the same contract or surface; compare unique changes and choose one chain.
- #175 remains a non-writing place-staging validator branch on an older base. Reconcile only if the staging validator is still needed; do not seed/publish Australian inventory as a side effect.

### SEO / conversion
- #200 is stacked on #199, and #202 is stacked on #200. This is a competing older chain relative to current-main route work and must be reconciled before integration.
- #173/#174/#176 were closed without merge after becoming stale; treat them as historical source material, not current merge candidates.
- #178 is a draft integration audit. Keep its findings useful, but do not assume its old base represents current main.

### Security
- #194 is a documentation-only least-privilege ACL proposal. It is not authorisation to change grants or RLS. The target Supabase project identity and effective access still need human verification.

## AI and global-scale direction

- First AI feature to design is a read-only, place-scoped “Ask this place” assistant over approved public records.
- Use existing server retrieval, canonical place hierarchy, findSupply() and groundedMatch(); do not introduce another discovery/ranking authority.
- Require server-side eligibility checks, record-backed citations, freshness/uncertainty, prompt-injection handling, bounded inputs/outputs, rate/cost controls, evaluation tests and an explicit feature gate before public activation.
- Existing AI drafting remains user-reviewed and must not invent facts or publish automatically.
- Grok design is a direction for this web app, not an automatic dependency on the external Grok product. A separately hosted Grok app would require a human architecture decision covering hosting, auth, API boundaries and ownership.

## Next actions

1. Confirm the actual Lovable Project Settings → Git sync destination is a non-main branch, and have an administrator confirm enforced main protection / required checks. Matching project/main SHAs do not prove the sync setting.
2. Review #211 and complete manual visual, keyboard, screen-reader and photo QA. Reconcile its now-multiple-commit-behind main ancestry, then a human may approve/merge only through repository controls.
3. Review #220 with manual responsive/keyboard/screen-reader QA at mobile/tablet/desktop widths. Its current-main exact-head Verify passes and it has no #211 dependency; do not treat CI as merge approval. #216 is closed as superseded.
4. Reconcile #213 to the current #211 parent after that parent is accepted and rerun exact-head Verify; do not edit Journey/Road Trip files in parallel.
5. Obtain the reported original `grok-workspace.zip` (reported SHA-256 `6eae21ffddcb1cd1b62025c416cd979ae2fa500321fce83b158b870c838c72a6`, not independently verified in this environment) or an accessible source/screenshots. Record a manifest before claiming complete design parity.
6. Choose one WorkOpportunity contract branch (#203 remains the current-main candidate), align locality/service metadata with the sitemap indexability gate, and keep ingestion fixture-first. Rights, credentials, country coverage, production access and publication remain human gates. Design any read-only assistant context/evaluation before a public endpoint.

## Canonical invariants

- findSupply() remains the sole possibility/discovery authority.
- No fabricated inventory, people, events, jobs, local knowledge or availability.
- Quiet/unknown states stay honest.
- Demonstration/unpublished/unreviewed/rights-uncleared content is excluded from public claims and indexability.
- No production writes, schema/RLS/grant changes, secrets, live partner feeds, autonomous publishing, merge or deployment without explicit human approval.
