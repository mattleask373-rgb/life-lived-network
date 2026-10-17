# Agent System Status — 2026-10-17 (control-tower reconciliation)

## SOURCE OF TRUTH

Repository evidence on `main`, GitHub Actions, open PRs, Issue #125 coordination comments, and canonical contracts are authoritative.
No autonomous production merge/deploy is active. No force-push. No production DB/RLS/credentials/keys changed.

## CURRENT QUEUE

### P0 / HUMAN-GATED (awaiting independent review)
- **#157** chore(security): remove tracked .env on current main base — open, non-draft, base = current main `5f06fc3`, Verify CI **PASS** (runs 38302368234 / 38302363931). Removes root `.env`, adds placeholder `.env.example`, updates `.gitignore`. History secret scan still outstanding. Highest hygiene priority.
- **#163** fix(discovery): require explicit service area for supply matches — open, non-draft, current main base, Verify CI **PASS**. Residence ≠ service coverage. Supersedes closed #155.
- **#154** fix(discovery): report exact open needs and fail closed by place — open, non-draft (`agent/grok/honest-open-needs`), current main base, Verify CI **PASS** (runs 38322786408 / 38322781400). Exact counts, fail-closed place scope. `findSupply()` untouched.
- **#129** seo: keep private routes out of crawler paths — open draft (`agent/seo-private-robots-2026-10-12`), current main base, Verify CI **PASS** (runs 38342379022 / 38342375838). Aligns robots.txt / generator / tests with `PRIVATE_PATHS` (adds /memories /partners /partner-tracker). Live publish still separate.
- **#156** test(routes): private route auth guards — open, non-draft, current main base, Verify CI **PASS**. Source-level regression for Issue #132. Browser matrix NOT RUN.
- **#165** test: restore production fixture policy coverage — open, non-draft, current main base, Verify CI **PASS**. Supersedes closed #131.

All above: mergeable_state blocked; green CI necessary but not sufficient. Prefer review/reconcile over new duplicates.

### SAFETY INCIDENT
- **Issue #133**: open. Lovable bot wrote directly to main (commit `7aca99a`, PostgrestVersion 14.5→14.17 in `src/integrations/supabase/types.ts`) during a nominally read-only turn. Human decision required (keep/revert via normal process + investigate sync). No auto-revert performed.

### PRODUCT / REAL-WORLD SURFACE
- **Canonical supply engine:** REAL and live on main. `src/lib/supply-engine.ts` contains the sole `findSupply()` authority. No second engine authorized.
- **place_memories:** owner-only. No public discovery path.
- Tracked root `.env` still present on main (publishable Supabase identifiers/URLs/keys only; no service-role observed in prior scans). No `.env.example` on main until #157 merges.
- Live origin `https://life-lived-network.lovable.app`:
  - `/robots.txt`: platform-default blanket `Allow: /` for Googlebot/Bingbot/Twitterbot/facebookexternalhit/`*`. Zero Disallow rules, no Sitemap line. (Repo `public/robots.txt` on main already has some Disallows + Sitemap.)
  - `/sitemap.xml` and `/api/public/sitemap.xml`: both return app 404 page.
  - Deployment/publish gap. #129 advances repo side only.

## VERIFIED CURRENT FINDINGS (2026-10-17 discrete cycle)

- main HEAD: `5f06fc336a748cf37c6a06ac272bee4a387bd745` ("Wired need front-door flow", 2026-10-12). Unchanged this cycle.
- Issue #125 open (agent-coordination fallback; Discussions tools unavailable).
- No fabricated inventory, availability, users, traction, or revenue.
- Unknown remains distinct from absence. Fixtures cannot be enabled in production path (source-level covered by open test PRs).
- Human gates required for merges, deploys, live RLS/config verification, credential rotation, history rewrite, external outreach.

## CI / DRIFT

- Listed priority PRs (#157/#163/#154/#129/#156/#165) have successful Verify on exact heads. Supabase Preview skipped.
- Older control-plane / AI-native PRs from 2026-10-07 status remain open but are not the current product priority.
- Live robots/sitemap not serving repo content. NOT RUN: full crawl, indexation, live RLS query, history secret scan, browser auth matrix.

## NEXT

1. Human/reviewer: independent review + merge decision for #157 (hygiene P0), then #163/#154 (discovery honesty), then #129 (SEO source) + publish/re-verify live robots/sitemap.
2. Human: decide #133 (types.ts version + Lovable write-to-main investigation).
3. After merges: history secret scan for former tracked .env; live RLS/grants verification plan (no production records exposed).
4. Agents continue only on `agent/grok/*` or focused chore/fix branches with draft/review PRs. No autonomous merge to main.

Evidence: GitHub API reads of main SHA, Issue #125/#133, targeted PR metadata + check runs, live HTTP probes of robots.txt/sitemap.xml this cycle.
