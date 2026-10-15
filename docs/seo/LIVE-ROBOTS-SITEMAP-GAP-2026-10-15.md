# Live SEO robots/sitemap gap analysis — 2026-10-15

**Checked by:** Grok (external coordination agent)  
**UTC window:** approximately 2026-10-15 17:00–18:00 UTC (session time ~17:08 EDT)  
**Published origin:** https://life-lived-network.lovable.app  
**Source of truth on main:** SHA `5f06fc336a748cf37c6a06ac272bee4a387bd745`

This is read-only HTTP evidence. It does not claim deployment status, indexing, or user impact. robots.txt is crawler guidance, not access control.

## Confirmed live behaviour

### robots.txt
- URL: https://life-lived-network.lovable.app/robots.txt
- Response: 200, content (excerpt):
  ```
  User-agent: Googlebot
  Allow: /

  User-agent: Bingbot
  Allow: /

  User-agent: Twitterbot
  Allow: /

  User-agent: facebookexternalhit
  Allow: /

  User-agent: *
  Allow: /
  ```
- No `Disallow` rules for private paths (`/profile`, `/conversations`, `/need`, `/help`, `/moderation`, `/sources`, `/memories`, `/partners`, `/partner-tracker`, `/auth`).
- No Sitemap directive present in the live file.

### Sitemap
- Source `public/robots.txt` on main declares `Sitemap: https://life-lived-network.lovable.app/api/public/sitemap.xml`.
- Live check of that URL returned a 404 HTML page ("Page not found").
- Alternate https://life-lived-network.lovable.app/sitemap.xml also returned 404.

### Sample routes
- https://life-lived-network.lovable.app/ → 200, public homepage with Lisbon demo content (explicitly labelled "A demo place").
- https://life-lived-network.lovable.app/profile → 200 with title "Who you are — The Living World"; minimal body observed (auth wall or empty shell; no private data visible in the fetched text).
- https://life-lived-network.lovable.app/memories → 404 "Page not found".

## Source vs live gap

On main (`public/robots.txt`):
```
User-agent: *
Allow: /

# Personal, private and internal screens...
Disallow: /auth
Disallow: /profile
Disallow: /conversations
Disallow: /need
Disallow: /help
Disallow: /moderation
Disallow: /sources

Sitemap: https://life-lived-network.lovable.app/api/public/sitemap.xml
```

`src/lib/seo.ts` `PRIVATE_PATHS` also includes `/memories`, `/partners`, `/partner-tracker` (not yet in main robots.txt).

Open PR [#129](https://github.com/mattleask373-rgb/life-lived-network/pull/129) aligns source robots.txt + tests with the full `PRIVATE_PATHS` list. It is green on current main base and ready for review. Merging it does not update the live published site; a subsequent Lovable republish is required for the live robots.txt to change.

## UNKNOWN / not claimed

- Whether the published snapshot matches the current main SHA (Lovable publishes a snapshot; last known matching commit was the #133 type change).
- Whether private routes ever render sensitive content before auth gates (covered by source tests in #156; live browser matrix in #132 remains NOT RUN here).
- Indexing status, crawl budget, or search-engine treatment of the live robots.txt.
- Existence of any other sitemap or robots variants.
- Production RLS / data exposure (not tested).

## Recommended next actions

1. Human reviewer: review and merge green PRs in priority order — #157 (env hygiene), #154 (discovery honesty), #129 (source robots alignment), #156 (auth guard tests).  
2. After #129 merges, human owner triggers a Lovable "Publish changes" so the live robots.txt receives the Disallow rules.  
3. Investigate why the declared sitemap endpoint 404s (source vs published route wiring) before adding locality pages.  
4. Do not generate synthetic locality content or claim inventory.

No production writes, merges, credential changes, or outreach performed.
