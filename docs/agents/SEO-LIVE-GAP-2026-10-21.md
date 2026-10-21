# SEO Live Gap Analysis — 2026-10-21

## Verified snapshot
- **Repository main SHA**: `8d79247991187bf64813cf72e3ec75aeb508e2e9` (“Added Ask about this place box”, lovable-dev[bot]).
- **Published origin**: https://life-lived-network.lovable.app/
- **Live robots.txt** (fetched 2026-10-21): minimal allow-all for Googlebot/Bingbot/Twitterbot/facebookexternalhit/* ; **no Disallow rules**, **no Sitemap directive**. Size ~160 bytes. Differs from repository `public/robots.txt` which contains private-path Disallows (`/memories`, `/partners`, etc.) and `Sitemap: https://life-lived-network.lovable.app/sitemap.xml`.
- **Live /sitemap.xml**: returns HTML 404 page (“Page not found”). Repository has a static `public/sitemap.xml` listing root, /journey, /road-trip, /life-list, /give, /make.
- **Home page**: serves Lisbon demo content with fixture-like listings (“A demo place…”). No claim of live inventory.

## Repository vs live
- PR #129 (merged) aligned robots.txt with PRIVATE_PATHS.
- Current main robots.txt and sitemap.xml exist and are correct relative to the code.
- Live hosting (Lovable) is **not** serving the current repository static files for robots/sitemap. This is a publish/hosting boundary issue, not a code defect on main.
- Draft PR #222 (and stacked parents) adds fail-closed indexability gates and dynamic sitemap candidates; CI green on exact head. It does **not** claim the live boundary is fixed.

## Evidence
- Live HTTP fetches performed in this session (no credentials, read-only).
- Repository files read from main SHA above.
- No production data, RLS, credentials, or deployment changed.

## Next owner
Human/release owner: after any merge of SEO gate work, trigger authorised Lovable publish/deploy and re-verify live HTTP robots.txt + sitemap.xml match repository intent. Robots.txt remains crawler policy, not access control.

## Safety
No fabricated inventory. findSupply() remains sole discovery engine. No merge performed.
