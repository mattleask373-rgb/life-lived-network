# Agent System Status — 2026-10-08 (Grok reconciliation)

## SOURCE OF TRUTH

Repository evidence on branches/PRs, GitHub Actions conclusions, and migrations are authoritative.
**No autonomous production merge/deploy is active. Production executor is NOT LIVE.**

## STATE MODEL (do not collapse)

`DESIGN → IMPLEMENTED → CI VERIFIED → HOSTED VERIFIED → REVIEWED → INTEGRATED → LIVE`

## CONTROL-PLANE STACK (open drafts — not on main)

| PR / branch | Capability | State |
|-------------|------------|--------|
| #64 | Lease fencing / provider auth hardening | IMPLEMENTED / CI failed historically / NOT LIVE |
| #96 | Authenticated execution identity contract | DESIGN–IMPLEMENTED / NOT LIVE |
| #99 | Autonomy frontier supervisor contract | DESIGN / NOT LIVE |
| #101 | Durable run/attempt ledger | IMPLEMENTED / NOT LIVE |
| #102 | Phase 2 provider-neutral runtime | IMPLEMENTED / NOT LIVE |
| #103 | Phase 3 supervisor reconcile + recovery | IMPLEMENTED / NOT LIVE |
| #104 | Phase 9 evidence verification kernel | IMPLEMENTED / NOT LIVE |
| #106 | Phase 10 durable attempt result RPC + gen/token fence | IMPLEMENTED / NOT LIVE |
| #108 | Phase 11 attempt-result idempotency | IMPLEMENTED / NOT LIVE |
| #109 | Phase 12 dispatch correlation scope fencing | IMPLEMENTED / NOT LIVE |
| harden-attempt-completion-fencing | Pure attempt completion fencing | IMPLEMENTED / NOT LIVE |
| ready-nonprod-runner / phase8 | Non-prod DRY_RUN rehearsal | IMPLEMENTED / NOT LIVE |
| phase6-human-attention-queue | Human attention priority queue | IMPLEMENTED / NOT LIVE |
| reclaim abandon (this branch) | Pure post-reclaim attempt ABANDON policy | IMPLEMENTED / NOT LIVE |

**Main:** product app + canonical supply engine. Full agent control-plane stack is **not** integrated on main.

## CI TRUTH

Exact-head Verify runs for Phases 3, 9, 10, 11, 12 have **conclusion: failure** (install/lockfile / external registry class — not proven application-logic green).

- PR #72 lockfile reconciliation remains a **human gate**.
- Do **not** claim CI VERIFIED without a green workflow on an exact SHA.

## HOSTED SUPABASE

**HOSTED PROOF PENDING** for:

- agent_* migrations applied on hosted project
- RLS denial for anon/authenticated on execution tables
- SECURITY DEFINER grants / search_path on dispatch + result RPCs
- concurrent claim / reclaim / stale-result race

## PRODUCT (main)

- Canonical `findSupply()` / supply engine: live on main (sole discovery authority)
- Ingest boundary: `src/lib/ingest/*`
- SEO foundations: `src/lib/seo.ts` (canonical, indexability, sitemap helpers)
- JSON-LD helpers: `src/lib/seo-jsonld.ts` (WebSite / Organization / BreadcrumbList — no fabricated ratings)

## HUMAN GATES (unchanged)

- Merge to main
- Production deploy / credentials
- Hosted migration apply + RLS proof
- Production 24/7 executor activation
- Paid ads / DNS / official social publish

## NEXT SAFE MOVES

1. Human: resolve #72 lockfile gate; re-run Verify on control-plane tip
2. Wire `decideReclaimAbandon` into durable reclaim RPC (same transaction as gen rotation)
3. Hosted non-prod proof of fencing + idempotency races
4. Product vertical slices (API + SEO route wiring) without second discovery engine
5. Integrate human-attention signals from HOLD / fence-reject / evidence-fail

## MANTRA

Maximum **verified** capability under bounded, explicit, auditable authority.
`IMPLEMENTED ≠ LIVE`. `UNKNOWN` is valid.
