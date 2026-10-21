# Agent System Status — 2026-10-21 (coordination cycle)

## Canonical baseline

- Repository: mattleask373-rgb/life-lived-network
- Current main SHA checked via GitHub: 8d79247991187bf64813cf72e3ec75aeb508e2e9 (“Added Ask about this place box”, Lovable/gpt-engineer-app[bot] sync).
- The repository branch API reports main as unprotected, with required status checks disabled. This is a release-process risk; propose branch protection/required checks for human approval, but do not change settings autonomously.
- No autonomous merge/deploy is authorised. Production data, schema, RLS/grants, secrets and live source activation remain human-gated.
- Issue #125 remains the open coordination thread. Issue #133 (Lovable bot wrote to main during read-only audit) remains open; human decision pending.

## Foundation confirmed on main

- Canonical place model and hierarchy: src/lib/places.ts and server-side place/locality functions.
- Shared service taxonomy: src/lib/service-taxonomy.ts.
- Single possibility/discovery authority: findSupply() in src/lib/supply-engine.ts.
- Deterministic evidence-based ranking seam: src/lib/grounded-matching.ts; doSomethingToday uses it through src/lib/intents.ts.
- Public listing retrieval and normalisation: src/lib/world.functions.ts and src/lib/listings.ts.
- Generic locality route and generic service-locality route exist on main. The remaining SEO task is to reconcile the explicit fail-closed indexability gate and ensure page metadata and sitemap enumeration use the same decision.
- Existing AI draft assistant: src/lib/draft-assist.functions.ts and src/lib/draft-assist.server.ts. It is signed-in, schema-bounded and saves no draft automatically.
- Read-only “Ask this place” assistant context policy is in draft PR #233 (fail-closed eligibility). Grounded matching is not an LLM assistant.
- Australia is not live. No rights-cleared pilot inventory should be implied by staging work.
- Env hygiene (#157) and robots.txt alignment (#129) previously merged. Live production origin https://life-lived-network.lovable.app still serves platform-default robots.txt (blanket Allow, no Disallows, no Sitemap) and 404 on /sitemap.xml — publish lag. Repo public/robots.txt and robotsTxt() are correct. Human republish of current main required.

## Design direction

- The Grok-inspired visual direction is being implemented in the canonical application; do not rebuild a second frontend or restore old branches wholesale.
- Current main includes the Grok-inspired home redesign. Extend the current component system surface-by-surface.
- Lovable remains an editing/sync path, not authority for domain contracts. GitHub main, reviewed changes and tests are the integration source of truth.
- Entry-card keyboard/accessibility fix remains draft PR #193. Automated CI from an earlier head does not replace exact-head Verify or manual 375px/desktop, keyboard and screen-reader checks.
- The detail/map and traveller UI work is split across stacked branches (e.g. #211, #220, #231); reconcile the base and shared files before integration.

## Active integration queue (snapshot; verify each head before acting)

### Design / accessibility
- #193 — EntryCard accessibility; base is older main, draft. Exact-head Verify and manual accessibility QA required.
- #195 — Grok detail/map controls. Confirm latest status/head before using as integration base.
- #211, #220, #231 — stacked Grok redesign / map / traveller integrations on current or near-current main. Prefer reconciling one chain.

### WorkOpportunity / ingestion
- #215 — reviewed WorkOpportunity contract ported onto current main; current-main base, draft. Candidate contract branch.
- #223 — Adzuna staging bridge stacked on #215. Staging only; no live feed or credentials.
- #219 — work-opportunity surfaces stacked on #215. Review against the contract and the canonical findSupply() path.
- #197, #199 and older are competing/older work-opportunity branches. Do not merge multiple implementations of the same contract or surface; compare unique changes and choose one chain.
- #175 remains a non-writing place-staging validator branch on an older base. Reconcile only if the staging validator is still needed; do not seed/publish Australian inventory as a side effect.

### SEO / conversion
- #222 — feat(seo): gate locality indexability and dynamic sitemaps (draft, stacked). Reconcile indexability gate so metadata and sitemap use one explainable policy.
- Live SEO gap (robots/sitemap) is publish lag, not code gap on main. Human republish required.
- Older chains (#200/#202) are stale relative to current main.

### Security / auth
- #194 is a documentation-only least-privilege ACL proposal. It is not authorisation to change grants or RLS. The target Supabase project identity and effective access still need human verification.
- #232 / #214 — private route guard regression tests reconciled to current main (draft). Prefer green exact-head CI.
- #133 remains open human decision on Lovable main-write incident.

### AI
- #233 — fail-closed Ask-this-place context policy (draft on current main).

## AI and global-scale direction

- First AI feature to design is a read-only, place-scoped “Ask this place” assistant over approved public records.
- Use existing server retrieval, canonical place hierarchy, findSupply() and groundedMatch(); do not introduce another discovery/ranking authority.
- Require server-side eligibility checks, record-backed citations, freshness/uncertainty, prompt-injection handling, bounded inputs/outputs, rate/cost controls, evaluation tests and an explicit feature gate before public activation.
- Existing AI drafting remains user-reviewed and must not invent facts or publish automatically.
- Grok design is a direction for this web app, not an automatic dependency on the external Grok product. A separately hosted Grok app would require a human architecture decision covering hosting, auth, API boundaries and ownership.

## Next actions

1. Human: republish current main to close live robots.txt / sitemap.xml gap on https://life-lived-network.lovable.app.
2. Human review + exact-head CI for priority drafts: #232 (auth tests), #222 (SEO indexability), #215/#223/#219 (WorkOpportunity chain), #233 (AI policy), design chain (#211/#193).
3. Reconcile one design/accessibility chain against current main; exact-head CI plus manual visual/keyboard/screen-reader checks.
4. Choose one WorkOpportunity contract branch (#215 is the current-main candidate), then one downstream staging/surface chain; mark duplicate alternatives superseded.
5. Keep source ingestion fixture-first and staged; rights, credentials, country coverage and publication remain human gates.
6. Decide branch protection and required CI checks for main; no repository settings change made by this update.
7. Resolve #133 (Lovable incident) with human decision.

## Canonical invariants

- findSupply() remains the sole possibility/discovery authority.
- place_memories are owner-only and never feed findSupply(), discovery, matching or sitemaps.
- No fabricated inventory, people, events, jobs, local knowledge or availability.
- Quiet/unknown states stay honest.
- Demonstration/unpublished/unreviewed/rights-uncleared content is excluded from public claims and indexability.
- No production writes, schema/RLS/grant changes, secrets, live partner feeds, autonomous publishing, merge or deployment without explicit human approval.
- Evidence or it did not happen. Never merge to main, never force-push.
