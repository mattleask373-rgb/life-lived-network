# Agent System Status — 2026-10-21 (coordination refresh)

## Canonical baseline

- Repository: mattleask373-rgb/life-lived-network
- Current main SHA checked via GitHub: 8d79247991187bf64813cf72e3ec75aeb508e2e9
- Latest main commit: Lovable/gpt-engineer-app[bot] sync (~2026-10-21T00:23Z).
- Main remains unprotected with required status checks disabled. Propose branch protection for human approval; do not change settings autonomously.
- No autonomous merge/deploy is authorised. Production data, schema, RLS/grants, secrets and live source activation remain human-gated.

## Foundation confirmed on main

- Canonical place model and hierarchy: src/lib/places.ts and server-side place/locality functions.
- Shared service taxonomy: src/lib/service-taxonomy.ts.
- Single possibility/discovery authority: findSupply() in src/lib/supply-engine.ts.
- Deterministic evidence-based ranking seam: src/lib/grounded-matching.ts; doSomethingToday uses it through src/lib/intents.ts.
- Public listing retrieval and normalisation: src/lib/world.functions.ts and src/lib/listings.ts.
- Generic locality and service-locality routes exist. Remaining SEO: reconcile explicit fail-closed indexability gate so metadata and sitemap use the same decision (see stacked PR #222).
- Existing AI draft assistant remains signed-in and schema-bounded.
- No live rights-cleared pilot inventory; Australia not live.

## Active integration queue (verify exact heads and CI before acting)

### Security / auth
- #232: private route guard tests on current main (draft).
- #194: least-privilege ACL documentation only (not authorisation for grants/RLS changes).

### SEO / indexability
- #222: gate locality indexability and dynamic sitemaps (stacked draft). Prefer reconciling this over new SEO work.

### WorkOpportunity / ingestion
- #215: reviewed opportunity contract ported to current main.
- Downstream stacked: #219 surfaces, #223 Adzuna staging (fixture-first; no live credentials).
- Do not merge competing older chains (#197/#199 etc.); choose one and mark others superseded.

### AI
- #233: fail-closed Ask-this-place context policy (draft). Disabled by default; human gate before public endpoint.

### Design
- Grok redesign extensions (#211, #231 etc.) stacked; require exact-head Verify + manual a11y QA.

## Canonical invariants

- findSupply() remains the sole possibility/discovery authority.
- place_memories are owner-only and never feed discovery.
- No fabricated inventory, people, events, jobs, local knowledge or availability.
- Quiet/unknown states stay honest.
- Demonstration/unpublished/unreviewed/rights-uncleared content excluded from public claims and indexability.
- No production writes, schema/RLS/grant changes, secrets, live partner feeds, autonomous publishing, merge or deployment without explicit human approval.

## Next actions

1. Human review of green security/SEO/auth PRs (#232, #222).
2. Reconcile one WorkOpportunity chain.
3. Refresh this STATUS on subsequent coordination cycles.
4. Decide branch protection / required checks.

Updated by Grok coordination cycle 2026-10-21. Evidence or it did not happen.
