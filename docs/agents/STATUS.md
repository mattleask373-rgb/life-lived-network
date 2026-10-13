# Agent System Status — 2026-10-13 (coordination snapshot)

## SOURCE OF TRUTH

Repository evidence on `main` (SHA `5f06fc336a748cf37c6a06ac272bee4a387bd745`), GitHub Actions Verify results, open PRs, and canonical contracts (`src/lib/supply-engine.ts` / `findSupply()`, AGENTS.md) are authoritative.
No autonomous production merge/deploy is active. No second discovery engine. place_memories remain owner-only.

## CURRENT QUEUE (highest priority first)

### P0 / SECURITY & HYGIENE
- **PR #157** — chore(security): remove tracked .env on current main base. Open, non-draft. Base current main. Head `d7b4c5943d046f1691e993716112497e21e1a1a5`. Verify **PASS**. Removes tracked root `.env`, adds placeholder `.env.example`. History scrub NOT RUN. Awaiting human review/merge. Supersedes older #127/#120.

### P0 / DISCOVERY HONESTY
- **PR #163** — fix(discovery): require explicit service area for supply matches. Open, non-draft. Base current main. Verify **PASS**. Residence ≠ service coverage. Supersedes closed #155. findSupply() sole engine.
- **PR #154** — fix(discovery): report exact open needs and fail closed by place. Open, non-draft. Base current main. Verify **PASS**. Exact counts + empty-state honesty + fail-closed place scope.

### P1 / LIVE SEO
- **PR #129** — seo: keep private routes out of crawler paths. Open **draft**. Base current main. Verify **PASS**. Aligns robots with PRIVATE_PATHS, static/dynamic sync, public sitemap of PUBLIC_PATHS only.
- **Live gap (reconfirmed 2026-10-13 ~23:12 UTC):** https://life-lived-network.lovable.app/robots.txt serves platform blanket `Allow: /` (zero Disallow, no Sitemap). /sitemap.xml returns app 404. Repo main `public/robots.txt` has partial Disallows but is not live. Requires merge of #129 + Lovable publish.

### P1 / AUTH GUARDS
- **PR #156** — test(routes): add regression tests verifying private route auth guards. Open, non-draft. Base current main. Verify **PASS**. Source-level only; #132 browser matrix still manual.

### HUMAN DECISIONS
- **Issue #133**: Lovable bot wrote PostgrestVersion change directly to main during read-only audit. Open. Human decision required (keep or reviewed-revert). No auto-revert.
- All top PRs have mergeable_state blocked (reviews required). Green CI necessary, not sufficient.

## VERIFIED CURRENT FINDINGS

- Main SHA unchanged: `5f06fc336a748cf37c6a06ac272bee4a387bd745` (Wired need front-door flow).
- Tracked root `.env` still present on main (hygiene gap addressed by #157).
- findSupply() remains sole discovery authority. No second engine.
- No fabricated inventory, availability, users, traction, or revenue.
- Live RLS / Supabase binding / history secret scan remain UNKNOWN.

## NEXT

1. Human founder: review/merge order #157 (hygiene) → #163 (service-area) → #154 (open-needs) → #129 (robots) → #156 (auth tests).
2. After merges + publish: recheck live robots.txt and sitemap.xml.
3. Agents: continue independent safe work (docs, tests) only while reviews pending. No production mutations.

Invariants held. Evidence: GitHub tool reads + live HTTP. Items marked UNKNOWN or NOT RUN where no evidence.
