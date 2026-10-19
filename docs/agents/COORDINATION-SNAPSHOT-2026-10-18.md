# Coordination Snapshot — 2026-10-18 (Grok discrete cycle)

Evidence-backed snapshot for Issue #125. No merges, no production changes.

## Verified current state
- **main HEAD:** `5f06fc336a748cf37c6a06ac272bee4a387bd745` ("Wired need front-door flow").
- **Issue #125:** open (coordination surface; Discussions unavailable).
- **Issue #133:** open. Human decision required: keep or reviewed-revert Lovable bot write of `PostgrestVersion` 14.5→14.17 directly to main during nominally read-only audit. No auto-action.

## Key open PRs (exact-head Verify = success; Supabase Preview skipped; mergeable_state=blocked awaiting review)
| PR | Title | Draft | Priority | Notes |
|----|-------|-------|----------|-------|
| [#157](https://github.com/mattleask373-rgb/life-lived-network/pull/157) | chore(security): remove tracked .env | false | P0 security/hygiene | 3 files. History scrub **NOT RUN**. |
| [#163](https://github.com/mattleask373-rgb/life-lived-network/pull/163) | fix(discovery): require explicit service area | false | P0 discovery honesty | Residence ≠ service area. |
| [#154](https://github.com/mattleask373-rgb/life-lived-network/pull/154) | fix(discovery): exact open needs + fail closed | false | P0 discovery honesty | Exact count + fail-closed place scope. |
| [#129](https://github.com/mattleask373-rgb/life-lived-network/pull/129) | seo: keep private routes out of crawler paths | true | SEO | Repo alignment + tests. |
| [#156](https://github.com/mattleask373-rgb/life-lived-network/pull/156) | test(routes): private route auth guards | false | auth/private routes | Source-level for #132. Not browser matrix. |

#131 / #155 closed unmerged (superseded). Green CI necessary, not sufficient.

## Live SEO gap (fetched this cycle)
- https://life-lived-network.lovable.app/robots.txt : HTTP 200, platform blanket `Allow: /` for Googlebot/Bingbot/Twitterbot/facebookexternalhit/*. **Zero Disallow rules, no Sitemap line.**
- https://life-lived-network.lovable.app/sitemap.xml : app 404 page.
- Repo `main` `public/robots.txt` contains Disallows + Sitemap. Live origin does not serve repo `public/` content. Publishing gap. #129 advances source; live effect requires human merge + Lovable publish. Full crawl/indexation **NOT RUN**.

## Blockers / human decisions
1. Independent review + merge #157 (hygiene P0).
2. Review + merge #163 (service-area honesty P0).
3. Review + merge #154 (exact open needs / fail-closed).
4. Decide #133 (keep/revert types; investigate Lovable write-to-main).
5. After merges: publish and re-verify live robots/sitemap.

## Next owner
**Human / release reviewer** for the P0 PRs above. Agents continue only on `agent/grok/*` or focused chore/fix branches with draft PRs.

## Invariants held
- `findSupply()` sole discovery engine.
- `place_memories` owner-only; never feed discovery/sitemaps.
- No second matcher. No fabricated inventory/availability/users/traction/revenue.
- No merge, force-push, production DB/RLS/credentials/keys changed.
- Evidence or it did not happen (NOT RUN / UNKNOWN marked).
