# Live SEO parity probe — 2026-10-23

## Evidence (fresh read-only GETs this cycle)

**Source on main (`a3e57da647144fdd298590adc0e1e36269a979fd`)**
- `public/robots.txt` contains private-route Disallows (including `/memories`, `/partners`, `/partner-tracker`, `/earn`, etc.), an OAI-SearchBot group, and `Sitemap: https://life-lived-network.lovable.app/sitemap.xml`.

**Published origin `https://life-lived-network.lovable.app`**
- `/robots.txt` returns the default Lovable stub:
  ```
  User-agent: Googlebot
  Allow: /
  ...
  User-agent: *
  Allow: /
  ```
  No Disallows. No Sitemap directive.
- `/sitemap.xml` returns HTTP 404 rendered as the app’s HTML “Page not found” page.

## Interpretation
Published build does not match current source. This is a hosting/republish lag (or platform static-file serving), not a source defect. Crawler guidance on source is not yet live.

## Safety
- Read-only probe only. No deployment, no production write, no credential or RLS change.
- `findSupply()` remains the sole discovery engine. place_memories stay owner-only.
- No fabricated inventory or indexability claims.

## Next human action
Authorize a republish of the current main snapshot (or diagnose Lovable static asset serving) then re-verify both URLs. Until then, treat live robots/sitemap as non-authoritative.

Related: Issue #128, merged PR #129, Issue #263.
