# Agent System Status — 2026-10-21 (Grok redesign integration / global integration phase)

## Canonical baseline

- Repository: mattleask373-rgb/life-lived-network
- Current main SHA checked via GitHub: `30c2877f93ee0218e7fee5e365ee55101f8b3afd` (current as of the latest audit on 2026-10-21).
- Latest main commit: “Enhanced picker UX and checks” with a Lovable edit ID. Three concurrent commits since `006a98c...` update `src/components/place-picker.tsx` and `src/components/place-search.tsx`.
- A prior repository audit reported main unprotected and required checks disabled. Current protection settings have not been independently re-read through this connector; treat enforcement as unverified until a repository administrator confirms current rules and required checks. The editor's configured Lovable sync target also remains unverified; the Lovable project snapshot now matches this main SHA, but this does not prove its settings. Confirm the editor destination is a non-main branch before further editor edits.
- No autonomous merge/deploy is authorised. Production data, schema, RLS/grants, secrets and live source activation remain human-gated.

## Foundation confirmed on main

- Canonical place model and hierarchy: src/lib/places.ts and server-side place/locality functions.
- Shared service taxonomy: src/lib/service-taxonomy.ts.
- Single possibility/discovery authority: findSupply() in src/lib/supply-engine.ts.
- Deterministic evidence-based ranking seam: src/lib/grounded-matching.ts; doSomethingToday uses it through src/lib/intents.ts.
- Public listing retrieval and normalisation: src/lib/world.functions.ts and src/lib/listings.ts.
- Generic locality route and generic service-locality route exist on main. The remaining SEO task is to reconcile the explicit fail-closed indexability gate and ensure page metadata and sitemap enumeration use the same decision.
- Existing AI draft assistant: src/lib/draft-assist.functions.ts and src/lib/draft-assist.server.ts. It is signed-in, schema-bounded and saves no draft automatically.
- No read-only “Ask this place” assistant is confirmed as implemented. Grounded matching is not an LLM assistant.
- Australia is not live. No rights-cleared pilot inventory should be implied by staging work.

## Design direction

- The Grok-inspired visual direction is being implemented in the canonical application; do not rebuild a second frontend or restore old branches wholesale.
- Current main includes the Grok-inspired home redesign. Extend the current component system surface-by-surface.
- Lovable remains an editing/sync path, not authority for domain contracts. GitHub main, reviewed changes and tests are the integration source of truth.
- Draft PR #211 (`integration/grok-redesign-ui-current-main-2026-10-21`, latest head `e7b732d25cd951f3ab3c1007257442563e361336`) is the design/accessibility foundation. Its newest commit adds a source-checkpoint note only; exact-head Verify passed in [run #39520719116](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39520719116). It remains based on the older `006a98c...` ancestry and needs main-base reconciliation plus manual visual, keyboard, screen-reader and photo QA.
- Draft PR #220 (`integration/grok-map-list-sync-main-2026-10-21`, head `e8fd148fa0223707fd317b80b19a47944c0bf1a2`) is the current-main map/list synchronization candidate. It is based directly on `30c2877f93ee0218e7fee5e365ee55101f8b3afd` and exact-head Verify passed in [run #39520945717](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39520945717): 45 test files / 342 tests, lint 0 errors / 7 warnings, production build succeeded. It has three changed files; manual visual/keyboard/screen-reader QA remains.
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
- #210 — shared redesign handoff / parity matrix (documentation-only draft).
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

1. Confirm the actual Lovable Project Settings → Git sync destination is a non-main branch, and have an administrator confirm enforced main protection / required checks. Do not infer either setting from matching SHAs.
2. Review #211 and complete manual visual, keyboard, screen-reader and photo QA. Human approves/merges it only through repository controls; reconcile the #213 base after the parent settles.
3. Review #220 with manual responsive/keyboard/screen-reader QA. Its CI passes on current main; it has no #211 dependency. Do not treat CI as approval to merge.
3. Obtain the reported original `grok-workspace.zip` (reported SHA-256 `6eae21ffddcb1cd1b62025c416cd979ae2fa500321fce83b158b870c838c72a6`, not independently verified in this environment) or durable screens/source. Record a manifest before claiming full redesign parity.
4. Choose one WorkOpportunity contract branch (#203 is the current-main candidate), then one downstream staging/surface chain; mark duplicate alternatives superseded.
5. Reconcile the indexability gate so locality/service metadata and sitemap enumeration use one explainable policy. Verify empty/demo-only pages remain noindex and absent from sitemaps.
6. Keep source ingestion fixture-first; rights, credentials, country coverage, production access and publication remain human gates. Define/read-only assistant evaluation before any public endpoint.

## Canonical invariants

- findSupply() remains the sole possibility/discovery authority.
- No fabricated inventory, people, events, jobs, local knowledge or availability.
- Quiet/unknown states stay honest.
- Demonstration/unpublished/unreviewed/rights-uncleared content is excluded from public claims and indexability.
- No production writes, schema/RLS/grant changes, secrets, live partner feeds, autonomous publishing, merge or deployment without explicit human approval.
