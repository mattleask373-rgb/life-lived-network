# Agent System Status — 2026-10-21 (coordination + live SEO gap)

## Canonical baseline

- Repository: mattleask373-rgb/life-lived-network
- Current main SHA checked via GitHub: 8d79247991187bf64813cf72e3ec75aeb508e2e9
- Latest main commit message: “Added Ask about this place box” (Lovable/gpt-engineer-app[bot] sync).
- The repository branch API reports main as unprotected, with required status checks disabled. This is a release-process risk; propose branch protection/required checks for human approval, but do not change settings autonomously.
- No autonomous merge/deploy is authorised. Production data, schema, RLS/grants, secrets and live source activation remain human-gated.
- Issue #125 remains the active agent coordination thread.

## Live SEO gap (verified this cycle, unauthenticated HTTP 2026-10-21 ~04:08 UTC)

- https://life-lived-network.lovable.app/robots.txt → HTTP 200, platform-default blanket Allow: / for Googlebot/Bingbot/Twitterbot/facebookexternalhit/* . **Zero Disallow rules. No Sitemap: directive.**
- https://life-lived-network.lovable.app/sitemap.xml → HTTP 404 HTML (app 404 page).
- Repo main (`public/robots.txt` + `src/lib/seo.ts` `robotsTxt()`) has correct Disallows for all PRIVATE_PATHS and Sitemap line (aligned via merged #129). Dynamic routes `src/routes/robots[.]txt.ts` and `src/routes/sitemap[.]xml.ts` exist.
- **FAIL (publish/deploy lag):** published origin does not yet serve current main static files or server routes. Human authorised republish of current main required. robots.txt is crawler policy, not access control.

## Foundation confirmed on main

- Canonical place model and hierarchy: src/lib/places.ts and server-side place/locality functions.
- Shared service taxonomy: src/lib/service-taxonomy.ts.
- Single possibility/discovery authority: findSupply() in src/lib/supply-engine.ts. No second engine.
- place_memories are owner-only and never feed findSupply(), discovery, matching or sitemaps.
- Deterministic evidence-based ranking seam: src/lib/grounded-matching.ts; doSomethingToday uses it through src/lib/intents.ts.
- Public listing retrieval and normalisation: src/lib/world.functions.ts and src/lib/listings.ts.
- Generic locality route and generic service-locality route exist on main. The remaining SEO task is to reconcile the explicit fail-closed indexability gate and ensure page metadata and sitemap enumeration use the same decision (see draft #222).
- Existing AI draft assistant: src/lib/draft-assist.functions.ts and src/lib/draft-assist.server.ts. It is signed-in, schema-bounded and saves no draft automatically.
- “Ask about this place” box exists on main as a disabled placeholder (no model call). Public grounded assistant remains gated.
- Australia is not live. No rights-cleared pilot inventory should be implied by staging work.

## Design direction

- The Grok-inspired visual direction is being implemented in the canonical application; do not rebuild a second frontend or restore old branches wholesale.
- Current main includes the Grok-inspired home redesign and Ask-this-place placeholder. Extend the current component system surface-by-surface.
- Lovable remains an editing/sync path, not authority for domain contracts. GitHub main, reviewed changes and tests are the integration source of truth.
- Entry-card keyboard/accessibility fix remains draft PR #193. Automated CI from an earlier head does not replace exact-head Verify or manual 375px/desktop, keyboard and screen-reader checks.
- The detail/map and traveller UI work is split across stacked branches; reconcile the base and shared files before integration. Prefer current-main based drafts (#211, #231, #220).

## Active integration queue (snapshot; verify each head/CI before acting)

### Security / hygiene (done or ready)
- #157 env hygiene: merged. Tracked root .env removed; .env.example added.
- #232 auth/private route guards: draft on current main, exact-head Verify success. Prefer over older #156.
- #194 ACL docs only (no grant/RLS change).

### SEO / indexability
- #222 — gate locality indexability and dynamic sitemaps (draft, stacked, Verify success on head). Candidate for fail-closed policy. Live gap remains until publish after review.
- Older #129 merged (robots alignment).

### Discovery honesty / work opportunities
- #154 honest open needs: open (older base). Prefer reconciling or current-main ports.
- Work-opportunity chain: #215 → #219 → #223 (current-main bases, drafts). Do not spawn duplicates; review sequentially.
- #155 residence-is-not-service closed unmerged; re-check if still needed on current main.

### AI / Ask-this-place
- #233 fail-closed Ask-this-place context policy: draft on current main.

### Design / accessibility
- #211 Grok redesign foundation, #231 Journey/Road Trip extension, #220 map/list sync, #229 source freshness. Stacked or independent drafts; visual/keyboard QA required.

## AI and global-scale direction

- First AI feature to design is a read-only, place-scoped “Ask this place” assistant over approved public records.
- Use existing server retrieval, canonical place hierarchy, findSupply() and groundedMatch(); do not introduce another discovery/ranking authority.
- Require server-side eligibility checks, record-backed citations, freshness/uncertainty, prompt-injection handling, bounded inputs/outputs, rate/cost controls, evaluation tests and an explicit feature gate before public activation.
- Existing AI drafting remains user-reviewed and must not invent facts or publish automatically.
- Grok design is a direction for this web app, not an automatic dependency on the external Grok product. A separately hosted Grok app would require a human architecture decision covering hosting, auth, API boundaries and ownership.

## Next actions

1. Human/release owner: review green current-main drafts (prefer #232 auth tests, #222 SEO gate after parents, #233 Ask policy). Then authorised Lovable publish of current main and re-verify live robots.txt / sitemap.xml.
2. Reconcile one design/accessibility chain against current main; exact-head CI plus manual visual/keyboard/screen-reader checks.
3. Choose one WorkOpportunity contract/surface chain; mark older competing branches superseded.
4. Keep source ingestion fixture-first and staged; rights, credentials, country coverage and publication remain human gates.
5. Define and test the read-only assistant context boundary before implementing its UI or public model endpoint.
6. Decide branch protection and required CI checks for main; no repository settings change made by this update.

## Canonical invariants

- findSupply() remains the sole possibility/discovery authority.
- No fabricated inventory, people, events, jobs, local knowledge or availability.
- Quiet/unknown states stay honest.
- Demonstration/unpublished/unreviewed/rights-uncleared content is excluded from public claims and indexability.
- No production writes, schema/RLS/grant changes, secrets, live partner feeds, autonomous publishing, merge or deployment without explicit human approval.
- place_memories owner-only; never discovery input.
