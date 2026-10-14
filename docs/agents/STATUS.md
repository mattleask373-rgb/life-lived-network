# Agent System Status — 2026-10-14 (coordination cycle refresh)

## SOURCE OF TRUTH

Repository evidence on `main` (SHA `5f06fc336a748cf37c6a06ac272bee4a387bd745`), GitHub Actions Verify results, open PRs, and canonical contracts are authoritative.
No autonomous production merge/deploy is active. Agents do not merge to main.

## VERIFIED CURRENT STATE (2026-10-14 ~20:10 UTC)

- **main HEAD:** `5f06fc336a748cf37c6a06ac272bee4a387bd745` ("Wired need front-door flow").
- Tracked root `.env` still present on main (project identifiers + publishable keys only; no service-role observed in prior scans). History scrub **NOT RUN**.
- `findSupply()` remains sole discovery engine (`src/lib/supply-engine.ts`). No second matcher. `place_memories` owner-only.
- Issue #125 open (coordination fallback). Issue #133 open (Lovable bot type-version write to main; human decision required; no auto-revert).

### Priority open PRs (Verify green on exact heads; mergeable_state blocked pending human review; Supabase Preview skipped)
| PR | Title | Draft | Head SHA prefix | Verify |
|----|-------|-------|-----------------|--------|
| #157 | chore(security): remove tracked .env | false | d7b4c594 | PASS |
| #163 | fix(discovery): require explicit service area | false | 3fb33ac0 | PASS |
| #154 | fix(discovery): exact open needs + fail closed | false | ad5dce30 | PASS |
| #156 | test(routes): private route auth guards | false | 6182d3de | PASS |
| #129 | seo: keep private routes out of crawler paths | true | eb3cf884 | PASS |

#131 / #155 closed unmerged (superseded by later work). Green CI necessary, not sufficient.

### Live SEO gap (HTTP fetch this cycle)
- https://life-lived-network.lovable.app/robots.txt : HTTP 200, platform-default blanket `Allow: /` for Googlebot/Bingbot/Twitterbot/facebookexternalhit/*. Zero Disallow rules, no Sitemap line.
- https://life-lived-network.lovable.app/sitemap.xml : app 404 page.
- Repo `public/robots.txt` has Disallows + Sitemap. Live origin serves platform default, not current repo content. Publishing gap. #129 advances source alignment; live effect requires human merge + Lovable publish. Full crawl/indexation **NOT RUN**.

## CURRENT QUEUE

### P0 HUMAN-GATED (security/hygiene > discovery honesty)
1. Review + merge #157 (tracked .env removal).
2. Review + merge #163 (explicit service area only; residence ≠ service).
3. Review + merge #154 (exact open needs / fail-closed by place).
4. Decide #133 (keep/revert types.ts PostgrestVersion; investigate Lovable write-to-main).
5. Then #156 auth tests, #129 SEO (after publish re-verify live robots/sitemap).

### Other
Live Supabase identity/RLS, history secret scan, production fixture behaviour, browser auth matrix (#132): **UNKNOWN / NOT RUN**. No production queries or DB/RLS/credential changes.

## INVARIANTS
findSupply() sole discovery engine; place_memories owner-only; no second matcher; no fabricated inventory/availability/users/traction/revenue. No merge, force-push, production DB/RLS/credentials/keys changed by agents. Evidence or UNKNOWN.

## NEXT
Human / release reviewer: prioritize #157 then #163 then #154. Agents continue only on agent/grok/* or focused chore/fix branches with draft PRs. Next discrete cycle rechecks after human action or advances independent tests/docs if still blocked.
