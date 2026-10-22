# Verified handoff — 2026-10-22 (Grok coordination cycle)

## Canonical main
- SHA: `d02459a384cb8ffcc6201839d45645e178ef0b2b`
- Confirmed via repository tree and open PR bases.

## Live SEO robots / sitemap (FAIL until republish)
Independent GET verification this cycle:

- `https://life-lived-network.lovable.app/robots.txt` returns platform-default content only:
  ```
  User-agent: Googlebot
  Allow: /
  ... (Bingbot, Twitterbot, facebookexternalhit, *)
  Allow: /
  ```
  No private-path Disallows and no Sitemap directive. Does **not** match committed `public/robots.txt` on main.

- `https://life-lived-network.lovable.app/sitemap.xml` returns the application's HTML 404 page, not XML.

Source on main (`public/robots.txt`) correctly lists private Disallows and points to the sitemap. Live host is not serving the committed public assets. This is a hosting/publish gap, not a source regression.

**Required:** Owner-approved diagnosis of Lovable publish/hosting path, then fresh GET confirmation that live `/robots.txt` and `/sitemap.xml` match the intended source policy. Robots is crawler policy only, not access control.

## Key open work (do not duplicate)
- Discovery honesty: draft PR #154 (exact locality need counts, fail-closed) — Verify green on head. Prefer review/rebase over new patch.
- Security/hygiene: PR #286 (k6 safety, .env tracked-file guard, connection CAS + migration) — Verify + CodeQL green. Needs human review.
- SEO route policy: draft #271 — Verify green.
- Older items (#157 env, #131 fixtures, #129 SEO, #156 auth) already closed.
- #133 remains the Lovable direct-main write incident; confirm non-main sync branch before any write-capable agent turns.

## Invariants (unchanged)
- `findSupply()` is the only discovery engine.
- place_memories owner-only.
- No fabricated inventory/availability/users/traction/revenue.
- No merge to main, no force-push, no production DB/RLS/credentials changes by agents.

## Next action for human
1. Review and decide on green PRs (#286 security first, then #154 discovery, #271 SEO).
2. Confirm Lovable Git sync target is non-main.
3. Authorize and verify live robots/sitemap republish.

Evidence: this file + Issue #125 comment + live GETs + PR check runs. No production changes made.
