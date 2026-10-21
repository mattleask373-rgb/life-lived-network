# Agent System Status — 2026-10-21 (coordination cycle)

## Canonical baseline

- Repository: mattleask373-rgb/life-lived-network
- Current main SHA checked via GitHub: `8d79247991187bf64813cf72e3ec75aeb508e2e9`
- Latest main commit: “Added Ask about this place box” (lovable-dev[bot] / gpt-engineer-app[bot] sync).
- Main remains unprotected; required status checks not enforced. Propose branch protection for human approval only; do not change settings autonomously.
- No autonomous merge/deploy authorised. Production data, schema, RLS/grants, secrets and live source activation remain human-gated.
- findSupply() remains the sole discovery engine. place_memories are owner-only.

## Foundation confirmed on main

- Canonical place model, service taxonomy, findSupply(), groundedMatch() / doSomethingToday, public listing retrieval present.
- Env hygiene: tracked root .env removed (PR #157 merged). .env.example present.
- SEO crawler policy: PR #129 merged. `public/robots.txt` contains Disallows for PRIVATE_PATHS + Sitemap directive. Static `public/sitemap.xml` lists only PUBLIC_PATHS.
- Live origin (https://life-lived-network.lovable.app) as of 2026-10-21: robots.txt is platform-default Allow:/ (no Disallows, no Sitemap); sitemap.xml returns 404 HTML. Repo is ahead of published snapshot (deploy lag).
- “Ask about this place” is a disabled placeholder on main; no model call. Full grounded assistant remains gated.

## Active open draft PRs (snapshot; verify exact heads and CI before acting)

Prefer reconciling existing green/current-main bases over spawning duplicates.

- SEO indexability / dynamic sitemaps: #222 (stacked)
- Auth / private route guards tests: #232 (current-main)
- Ask-this-place eligibility policy: #233
- Work-opportunity contract / surfaces / Adzuna staging: #215 → #219 → #223 (stacked)
- Freshness / last-checked: #229 (stacked on redesign)
- Grok redesign extensions: #211, #231, #220, #210 (handoff docs)
- Locality refresh: #228 (stacked on #222)
- Older items: #154 (open needs) may need rebase; #156 auth tests; #131 fixtures closed unmerged; #133 type-version decision still open.

## Live SEO gap

Code on main is aligned. Published Lovable origin does not yet serve the repo robots.txt or sitemap. Human authorised republish required, then re-verify live HTTP.

## Next actions

1. Human review of highest-priority green drafts (SEO gate #222 after parents, auth tests #232, Ask-place #233).
2. Authorised publish of current main to close live robots/sitemap gap; re-probe.
3. Confirm #133 generated type change and Lovable sync target (must not be main for write mode).
4. Keep ingestion fixture-first and rights-gated. No fabricated inventory.
5. Refresh this STATUS after merges or publish.

## Canonical invariants

- findSupply() sole possibility/discovery authority.
- No fabricated inventory, people, events, jobs, local knowledge or availability.
- Quiet/unknown states stay honest.
- Demonstration/unpublished/unreviewed/rights-uncleared content excluded from public claims and indexability.
- No production writes, schema/RLS/grant changes, secrets, live partner feeds, autonomous publishing, merge or deployment without explicit human approval.
