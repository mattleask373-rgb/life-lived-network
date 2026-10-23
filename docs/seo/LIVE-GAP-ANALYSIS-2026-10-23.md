# Live SEO robots/sitemap gap analysis — 2026-10-23

## Verified snapshot

- **Canonical main SHA:** `a3e57da647144fdd298590adc0e1e36269a979fd`
- **Source `public/robots.txt` (on main):** Contains User-agent rules with Disallow for private routes (`/auth`, `/profile`, `/conversations`, `/need`, `/help`, `/moderation`, `/sources`, `/memories`, `/partners`, `/partner-tracker`, `/earn`), plus an explicit `Sitemap: https://life-lived-network.lovable.app/sitemap.xml` directive. `/life-list` is intentionally not Disallowed so crawlers can observe its noindex metadata.
- **Live published origin probe (GET, 2026-10-23 ~04:10 UTC):**
  - `https://life-lived-network.lovable.app/robots.txt` → HTTP 200, platform-default Allow-only content (Googlebot/Bingbot/Twitterbot/facebookexternalhit/* Allow: /). **No Disallow rules. No Sitemap directive.** **FAIL** relative to source.
  - `https://life-lived-network.lovable.app/sitemap.xml` → HTTP 200 but rendered as HTML 404 page ("Page not found"). **FAIL** (no XML sitemap served).

## Classification

This is a **published-build / hosting / Lovable sync parity gap**, not a source defect. Current main already contains the static sitemap index, robots Sitemap directive, private-route Disallows, and a scheduled `.github/workflows/seo-live-smoke.yml`. Prior STATUS.md and Issue #125 comments recorded the same mismatch on earlier dates; this cycle re-verified it against the current main SHA.

Robots.txt is crawler guidance only and is **not** access control. Private data exposure would be a separate RLS/route-guard finding.

## What this cycle did **not** do

- No production deployment, Lovable project setting change, or hosting configuration edit.
- No schema/RLS/grant/credential change.
- No claim that the published app matches source; the probe evidence shows it does not.
- No autonomous merge.

## Human gate / next owner

Repository owner / Lovable project admin: confirm the connected Git repository + non-main sync branch, confirm the published build SHA matches (or is intended to lag) current main, and authorize a republish or hosting-config correction so that live `/robots.txt` and `/sitemap.xml` match the source files on the verified main SHA. Re-run the existing daily SEO live smoke after the authorized publish.

Until then, treat live indexability as **unknown / mismatched** and do not claim SEO readiness based on repository files alone.

## Evidence links

- Source robots: https://github.com/mattleask373-rgb/life-lived-network/blob/a3e57da647144fdd298590adc0e1e36269a979fd/public/robots.txt
- Live probes performed this cycle (read-only GET).
- Related open issue coordination: #125
- Related prior findings: #263, STATUS.md authoritative snapshot.
