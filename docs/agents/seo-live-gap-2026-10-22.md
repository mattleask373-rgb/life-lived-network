# Live SEO parity gap — 2026-10-22 verified probe

## Purpose
Record an evidence-backed, read-only observation of the published Lovable host versus current `main` source. This is **not** a fix, deployment, or claim of resolution. It is coordination evidence for the next human gate.

## Source of truth on main
- `public/robots.txt` (SHA of tree at probe time) contains explicit `Disallow` rules for private routes (`/auth`, `/profile`, `/conversations`, `/need`, `/help`, `/moderation`, `/sources`, `/memories`, `/partners`, `/partner-tracker`, `/earn`) and a `Sitemap: https://life-lived-network.lovable.app/sitemap.xml` directive.
- Private routes are also governed by application-level policy (see `src/lib/seo.ts` and related route guards). Robots.txt is crawler guidance, **not** access control.
- `/life-list` is intentionally left crawlable so that crawlers can observe its noindex metadata.

## Live published host (GET-only, 2026-10-22)
Target: `https://life-lived-network.lovable.app`

| Path | Observed response | Notes |
|------|-------------------|-------|
| `/robots.txt` | HTTP 200, plain text | Platform-default content: only `User-agent: *` / `Allow: /` (plus a few bot-specific Allow lines). **No** Disallow rules. **No** Sitemap directive. |
| `/sitemap.xml` | HTTP 404 rendered as HTML | Returns the Lovable "Page not found" HTML page, not an XML sitemap index or child sitemaps. |
| `/life-list` | HTTP 200 HTML | Title and body include "Only you see this. There's no score, and nothing expires." No robots=noindex or canonical tags were visible in the returned HTML snippet. |

## Interpretation
- **Published-build / source parity failure** (or hosting/static-asset configuration gap). Current `main` already contains the intended static robots and sitemap assets/routes.
- This matches the prior observation recorded in `docs/agents/STATUS.md`.
- No evidence of cross-account data leakage from this probe. The `/life-list` page is publicly reachable and displays its private-list messaging.
- No production settings, deployment, RLS, credentials, or database were touched.

## Human gates remaining
1. Confirm the authoritative production hostname and the exact published build SHA in Lovable Project Settings.
2. After an owner-approved publish/redeploy that includes current `main`, re-run the same GET-only checks.
3. Verify that the live `/robots.txt` matches source, that `/sitemap.xml` returns valid XML listing only indexable public content, and that private routes return appropriate noindex / auth-gated behaviour.
4. Do **not** treat robots.txt as a security boundary.

## Next smallest safe action
- Human: confirm Lovable Git sync target (non-main branch) and trigger a publish of current main if desired.
- Agents: continue independent review of open green PRs; do not spawn duplicate SEO policy PRs until live parity is re-checked post-publish.

Evidence collected via read-only HTTP GETs. No fabricated inventory or availability claims.
