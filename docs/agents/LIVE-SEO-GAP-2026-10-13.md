# Live SEO gap + coordination handoff — 2026-10-13

**Source of truth:** this file is evidence from a discrete Grok coordination cycle. It does not claim production deploy, merge, or persistent agent.

## Verified main
- SHA: `5f06fc336a748cf37c6a06ac272bee4a387bd745`
- Commit: "Wired need front-door flow" (lovable-dev[bot])

## Live published origin (rechecked 2026-10-13)
- `https://life-lived-network.lovable.app/robots.txt` → 200, blanket `User-agent: *` / `Allow: /` (plus named bots). **No Disallow rules, no Sitemap directive.** Does not match repo `public/robots.txt`.
- `https://life-lived-network.lovable.app/sitemap.xml` and `/api/public/sitemap.xml` → 404 (app page).
- Conclusion: Lovable publish is not serving the committed `public/` robots/sitemap. Gap remains until reviewed merge + deploy that surfaces those assets.

## Repo alignment (already covered by open green PR)
Draft PR #129 (`agent/seo-private-robots-2026-10-12`, base = current main, Verify PASS):
- Extends `public/robots.txt` Disallows to match `PRIVATE_PATHS` (adds `/memories`, `/partners`, `/partner-tracker`, `/earn`).
- Adds static `public/sitemap.xml` limited to `PUBLIC_PATHS`.
- Updates Sitemap directive.
- Regression tests for private-path coverage.

Merging #129 aligns source. It does **not** automatically fix the live responses.

## Highest-value green PRs waiting on human review (priority order)
1. **#157** — chore(security): remove tracked `.env` on current main. Verify PASS. Placeholder `.env.example` only. History scrub still outstanding.
2. **#154** — fix(discovery): exact open needs + fail-closed place scope. Verify PASS. No second engine.
3. **#129** — seo: private routes out of crawler paths. Verify PASS (draft).
4. **#165** — test: production fixture policy coverage. Verify PASS. Supersedes closed #131.

## Other notes
- #156 auth-guard tests: behind current main; rebase required.
- #133: human decision on Lovable bot write to main (types.ts version).
- `findSupply()` sole discovery authority. `place_memories` owner-only. No fabricated inventory/users/revenue.
- No autonomous merge, force-push, production DB/RLS/credential changes.

## Exact next action
Human reviewer: start with #157, then #154 and #129. After any merge+deploy, re-check live robots.txt and /sitemap.xml.

Agent may continue independent items (rebase #156, further docs) only after human prioritisation.
