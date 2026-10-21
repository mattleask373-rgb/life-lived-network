# Agent System Status — 2026-10-21 (coordination cycle)

## Canonical baseline

- Repository: mattleask373-rgb/life-lived-network
- Current main SHA checked via GitHub: `8d79247991187bf64813cf72e3ec75aeb508e2e9` (“Added Ask about this place box”, Lovable/gpt-engineer-app[bot]).
- The repository ruleset for protecting main is disabled. Branch protection / required checks remain a human decision; do not change settings autonomously.
- No autonomous merge/deploy is authorised. Production data, schema, RLS/grants, secrets and live source activation remain human-gated.
- Env hygiene (#157) and robots/private-path alignment (#129) are previously merged. Tracked `.env` is absent; `.env.example` and aligned `public/robots.txt` are on main.

## Live SEO gap (verified)

- Live origin `https://life-lived-network.lovable.app/robots.txt` serves platform-default blanket Allow (no Disallows, no Sitemap directive).
- `/sitemap.xml` returns 404 HTML (app shell), not XML.
- Repo main has correct static `public/robots.txt` (matching `robotsTxt()` / `PRIVATE_PATHS`) and `public/sitemap.xml` (PUBLIC_PATHS only), plus dynamic server routes.
- Gap is a hosting/publish boundary. Human authorised republish of current main required, then re-verify live HTTP. robots.txt is crawler policy only, not access control.

## Foundation confirmed on main

- Canonical place model and hierarchy: src/lib/places.ts and server-side place/locality functions.
- Shared service taxonomy: src/lib/service-taxonomy.ts.
- Single possibility/discovery authority: findSupply() in src/lib/supply-engine.ts.
- Deterministic evidence-based ranking seam: src/lib/grounded-matching.ts; doSomethingToday uses it through src/lib/intents.ts.
- Public listing retrieval and normalisation: src/lib/world.functions.ts and src/lib/listings.ts.
- Generic locality route and generic service-locality route exist on main. Indexability gate work is in draft #222 (stacked).
- Existing AI draft assistant: src/lib/draft-assist.functions.ts and src/lib/draft-assist.server.ts. It is signed-in, schema-bounded and saves no draft automatically.
- “Ask about this place” on main is a disabled placeholder (no model call). Fail-closed context policy is in draft #233. Public grounded assistant remains gated on #209.
- Australia is not live. No rights-cleared pilot inventory should be implied by staging work.

## Active integration queue (snapshot; verify each head/CI before acting)

### Security / auth
- #232 — private route guard checks on current main (draft). Prefer this over older #156/#214.
- #194 — documentation-only least-privilege ACL proposal. Not authorisation to change grants or RLS.

### SEO / indexability
- #222 — gate locality indexability and dynamic sitemaps (draft, stacked on work-opp surfaces; Verify success reported on head). Reconcile with parents before integration.
- Live gap remains until human publish.

### WorkOpportunity / ingestion
- Current-main candidate chain: #215 (contract) → #219 (surfaces) → #223 (Adzuna staging). Staging only; no live feed or credentials.
- Older competing chains (#197/#199 etc.) should be marked superseded after one chain is chosen. Do not merge multiple implementations.

### Design / accessibility / Grok UI
- #211 — accessible redesign surfaces on current main (draft). Visual/keyboard/screen-reader QA required.
- #231 — Journey/Road Trip extension stacked on #211.
- #220 — home map/list synchronization (independent).
- #229 — public source last-checked freshness stacked on redesign.
- Prefer reconciling the current-main redesign chain over older branches.

### AI
- #233 — fail-closed Ask-this-place context policy (draft on current main).
- #209 — read-only grounded place assistant (open issue).

### Discovery honesty
- #154 — exact open needs / fail-closed by place remains open (older base; mergeable_state dirty). Reconcile if still needed; no second discovery engine.

## Next actions

1. Human: review and decide merge order on green current-main drafts (prioritise #232 auth, then SEO chain #222 after parents, AI #233). Independent review required.
2. Human/release: authorised Lovable publish of current main to close live robots/sitemap gap; re-verify HTTP.
3. Human: confirm #133 PostgrestVersion change and Lovable sync target (must not be main for write-mode).
4. Agents: continue independent tests/docs only while top items await human review. No duplicates of open green PRs.
5. Decide branch protection and required CI checks for main; no settings change made by agents.

## Canonical invariants

- findSupply() remains the sole possibility/discovery authority.
- No fabricated inventory, people, events, jobs, local knowledge or availability.
- Quiet/unknown states stay honest.
- Demonstration/unpublished/unreviewed/rights-uncleared content is excluded from public claims and indexability.
- place_memories are owner-only and never feed findSupply(), discovery, matching or sitemaps.
- No production writes, schema/RLS/grant changes, secrets, live partner feeds, autonomous publishing, merge or deployment without explicit human approval.
