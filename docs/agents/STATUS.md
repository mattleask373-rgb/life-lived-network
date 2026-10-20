# Agent System Status — 2026-10-20 (global integration phase)

## Canonical baseline

- Repository: mattleask373-rgb/life-lived-network
- Current main SHA checked via GitHub: 006a98c64a52d5bd6028ac5f9457acd31a72746a
- Latest main commit message: “Update plan” (Lovable bot) after merges of #208 (prettier) and #207 (docs).
- The repository branch API reports main as unprotected, with required status checks disabled. This is a release-process risk; propose branch protection/required checks for human approval, but do not change settings autonomously.
- No autonomous merge/deploy is authorised. Production data, schema, RLS/grants, secrets and live source activation remain human-gated.
- Env hygiene: tracked .env removed via merged #157; .gitignore correctly ignores real env files.

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
- Entry-card keyboard/accessibility fix remains draft PR #193. Automated CI from an earlier head does not replace exact-head Verify or manual 375px/desktop, keyboard and screen-reader checks.
- The detail/map and traveller UI work is split across stacked branches; reconcile the base and shared files before integration.

## Active integration queue (snapshot; verify each head before acting)

### Design / accessibility
- #193 — EntryCard accessibility; base is current main, draft. Exact-head Verify and manual accessibility QA required.
- #195 — Grok detail/map controls; #201 is stacked on its branch. Confirm #195's latest status/head before using it as an integration base.

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

### Discovery honesty
- #154 open (non-draft) for exact open-need counts + fail-closed place scope; needs rebase against current main (dirty). Prefer reconciling with #172 if overlapping.

### Security
- #194 is a documentation-only least-privilege ACL proposal. It is not authorisation to change grants or RLS. The target Supabase project identity and effective access still need human verification.
- #156 open with green Verify for private route auth guard regression tests.

## AI and global-scale direction

- First AI feature to design is a read-only, place-scoped “Ask this place” assistant over approved public records (Issue #209).
- Use existing server retrieval, canonical place hierarchy, findSupply() and groundedMatch(); do not introduce another discovery/ranking authority.
- Require server-side eligibility checks, record-backed citations, freshness/uncertainty, prompt-injection handling, bounded inputs/outputs, rate/cost controls, evaluation tests and an explicit feature gate before public activation.
- Existing AI drafting remains user-reviewed and must not invent facts or publish automatically.
- Grok design is a direction for this web app, not an automatic dependency on the external Grok product. A separately hosted Grok app would require a human architecture decision covering hosting, auth, API boundaries and ownership.

## Next actions

1. Reconcile one design/accessibility chain against current main; exact-head CI plus manual visual/keyboard/screen-reader checks.
2. Choose one WorkOpportunity contract branch (#203 is the current-main candidate), then one downstream staging/surface chain; mark duplicate alternatives superseded.
3. Reconcile the indexability gate so locality/service metadata and sitemap enumeration use one explainable policy. Verify empty/demo-only pages remain noindex and absent from sitemaps.
4. Rebase or supersede #154 discovery honesty PR; review #156 auth tests.
5. Keep source ingestion fixture-first and staged; rights, credentials, country coverage and publication remain human gates.
6. Define and test the read-only assistant context boundary before implementing its UI or public model endpoint.
7. Decide branch protection and required CI checks for main; no repository settings change made by this update.

## Canonical invariants

- findSupply() remains the sole possibility/discovery authority.
- No fabricated inventory, people, events, jobs, local knowledge or availability.
- Quiet/unknown states stay honest.
- Demonstration/unpublished/unreviewed/rights-uncleared content is excluded from public claims and indexability.
- No production writes, schema/RLS/grant changes, secrets, live partner feeds, autonomous publishing, merge or deployment without explicit human approval.
- place_memories are owner-only.
