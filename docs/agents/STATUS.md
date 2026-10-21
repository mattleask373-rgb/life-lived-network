# Agent System Status — 2026-10-21 (coordination cycle)

## Canonical baseline

- Repository: mattleask373-rgb/life-lived-network
- Current main SHA checked via GitHub: `8d79247991187bf64813cf72e3ec75aeb508e2e9`
- Latest main commit message: “Added Ask about this place box” (gpt-engineer-app[bot] / Lovable sync).
- Env hygiene (#157) and private-route robots alignment (#129) previously merged. Tracked root `.env` absent; `.env.example` present; `public/robots.txt` aligned to PRIVATE_PATHS.
- The repository branch API reports main as unprotected, with required status checks disabled. Propose branch protection/required checks for human approval; do not change settings autonomously.
- No autonomous merge/deploy is authorised. Production data, schema, RLS/grants, secrets and live source activation remain human-gated.

## Live SEO gap (verified 2026-10-21)

- https://life-lived-network.lovable.app/robots.txt → HTTP 200, platform-default blanket `Allow: /` for Googlebot/Bingbot/Twitterbot/facebookexternalhit/* and `*`. Zero Disallow rules. No Sitemap directive.
- https://life-lived-network.lovable.app/sitemap.xml → 404 HTML.
- Repo main has correct static `public/robots.txt` + dynamic `robotsTxt()` matching PRIVATE_PATHS and Sitemap directive. **FAIL (publish lag)**. Human republish/redeploy of current main required to close the gap. No code change can force platform default without authorised dashboard/publish access.

## Foundation confirmed on main

- Canonical place model and hierarchy: src/lib/places.ts and server-side place/locality functions.
- Shared service taxonomy: src/lib/service-taxonomy.ts.
- Single possibility/discovery authority: findSupply() in src/lib/supply-engine.ts.
- Deterministic evidence-based ranking seam: src/lib/grounded-matching.ts; doSomethingToday uses it through src/lib/intents.ts.
- Public listing retrieval and normalisation: src/lib/world.functions.ts and src/lib/listings.ts.
- Generic locality route and generic service-locality route exist on main. Remaining SEO task is to reconcile the explicit fail-closed indexability gate (see open draft #222) and ensure page metadata and sitemap enumeration use the same decision.
- Existing AI draft assistant: src/lib/draft-assist.functions.ts and src/lib/draft-assist.server.ts. It is signed-in, schema-bounded and saves no draft automatically.
- “Ask about this place” UI box present on main (placeholder); fail-closed policy draft in #233. No public model endpoint enabled. Grounded matching is not an LLM assistant.
- Australia is not live. No rights-cleared pilot inventory should be implied by staging work.

## Design direction

- The Grok-inspired visual direction is being implemented in the canonical application; do not rebuild a second frontend or restore old branches wholesale.
- Current main includes the Grok-inspired home redesign. Extend the current component system surface-by-surface (open drafts #211, #231, #220, etc.).
- Lovable remains an editing/sync path, not authority for domain contracts. GitHub main, reviewed changes and tests are the integration source of truth.
- Entry-card keyboard/accessibility fix remains draft PR #193. Automated CI from an earlier head does not replace exact-head Verify or manual 375px/desktop, keyboard and screen-reader checks.

## Active integration queue (snapshot 2026-10-21; verify each head before acting)

Prefer reconciling existing green/draft PRs over spawning duplicates.

### Security / auth / hygiene
- #232 — test(security): reconcile private route guard checks on current main (draft, open).
- #156 — older auth tests (open, older base).
- #194 — docs-only least-privilege ACL proposal (not authorisation to change grants/RLS).

### SEO / indexability
- #222 — feat(seo): gate locality indexability and dynamic sitemaps (draft, open; Verify success reported on head).
- Live robots/sitemap gap persists until human publish of current main.

### WorkOpportunity / ingestion
- Current-main candidates: #215 (contract), #223 (Adzuna staging), #219 (surfaces). Prefer one chain; mark older (#197/#199/#203 etc.) superseded after comparison.
- Staging only; no live feed or credentials.

### AI
- #233 — feat(ai): add fail-closed Ask-this-place context policy (draft, open). Disabled by default until human review.

### Other open drafts
- Many stacked design, locality refresh, source health, etc. Reconcile bases before merge.

## AI and global-scale direction

- First AI feature is a read-only, place-scoped “Ask this place” assistant over approved public records.
- Use existing server retrieval, canonical place hierarchy, findSupply() and groundedMatch(); do not introduce another discovery/ranking authority.
- Require server-side eligibility checks, record-backed citations, freshness/uncertainty, prompt-injection handling, bounded inputs/outputs, rate/cost controls, evaluation tests and an explicit feature gate before public activation.
- Existing AI drafting remains user-reviewed and must not invent facts or publish automatically.

## Next actions

1. Human: republish/deploy current main (`8d792479…`) to close live robots.txt + sitemap gap; then re-verify HTTP.
2. Human: review/approve highest-value green drafts starting with security/auth (#232) and SEO (#222 after any parent chain).
3. Choose one WorkOpportunity contract/surface chain; mark duplicates superseded.
4. Review #233 AI policy (keep disabled until explicit approval).
5. Decide branch protection and required CI checks for main; no repository settings change made by this update.
6. Agents: continue independent safe items (tests, docs, gap analysis) only while top items wait on human review. Prefer reconciling existing PRs.

## Canonical invariants

- findSupply() remains the sole possibility/discovery authority.
- No fabricated inventory, people, events, jobs, local knowledge or availability.
- Quiet/unknown states stay honest.
- Demonstration/unpublished/unreviewed/rights-uncleared content is excluded from public claims and indexability.
- place_memories are owner-only and never feed discovery.
- No production writes, schema/RLS/grant changes, secrets, live partner feeds, autonomous publishing, merge or deployment without explicit human approval.
