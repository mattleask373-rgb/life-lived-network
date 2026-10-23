# ADR 004: Canonical Backend Project and Migration Authority

**Status:** Proposed — owner confirmation and technical/security review required  
**Updated:** 2026-10-23  
**Reviewed source baseline:** `main` at `a3e57da647144fdd298590adc0e1e36269a979fd`

## Decision to be made

Real World Atlas needs one verified source of truth for application code, deployment, backend identity and schema migrations. The current evidence still does not identify the authoritative hosted environment with sufficient confidence for sync, publish or database mutation.

## Current evidence (read-only)

- Repository: `mattleask373-rgb/life-lived-network`; default branch `main`.
- Repository `supabase/config.toml` declares project reference `csgngcnaqeoxyopvnzjo`.
- The connected Supabase integration returned two projects: `caaosyevvdhxwsrqhqur` (“Live lived”) and `nzrxulxodbckvbbslavw` (“World-Finder”). Neither reference matches the repository config. Neither project may be assumed to be the app's backend.
- Connected Lovable project “Real World Atlas” has project ID `b3293d2a-3218-4206-ab04-af8e984023ac`. The connector reports published=true and latest revision `7ca12a5900d708014d63b03847f2c922965ea1be`, but does not expose authoritative Project Settings → Git destination or prove which build is serving the canonical hostname.
- The observed revision belongs to the divergent `Loveable/work/safely` line. A read-only comparison against current main returned 18 commits ahead and 644 behind. Do not bulk-sync, overwrite or publish this branch.
- Current main's exact-head Verify run `39882429187` passed lint, tests, build, environment-file guard, empty-database migration replay, local agent-control-plane SQL tests and database function lint. CodeQL/locked dependency audit run `39882429184` also passed. These prove repository checks, not hosted schema or deployment identity.
- The repo contains the canonical `supabase/migrations/` chain. `drizzle/migrations/0000_place_memories.sql` and the generated `drizzle/schema.ts` stub are also present; migration ownership and actual deployed history still require an explicit reconciliation.
- A GET to the observed candidate host `https://life-lived-network.lovable.app` returned `/robots.txt` as allow-all without a sitemap directive, `/sitemap.xml` as HTML 404, and `/life-list` HTML without visible noindex metadata. The canonical host/build has not been independently confirmed; treat this as a source/deployment parity finding, not evidence of private-data exposure.

## Provisional technical direction (not an accepted owner decision)

1. Keep GitHub `main` as the canonical reviewed source branch.
2. Use a protected, non-main Lovable sync branch and require reviewed pull requests before any integration into main.
3. Select one owner-authorized backend project after the owner/admin verifies project identity in the authoritative Lovable and Supabase settings. Separate development/staging/production and credentials.
4. Prefer `supabase/migrations/` as the sole canonical SQL migration chain, conditional on reconciling the Drizzle Place Memories migration with the actual schema and migration ledger in a disposable environment.
5. Keep database, maps/tiles, routing/transit, search, AI, email, media, payments and ingestion behind documented interfaces; keep provider secrets out of browser code and logs.
6. Require a documented rebuild, export and restore rehearsal before considering vendor portability complete.

## Evidence required before acceptance

- Owner-confirmed Lovable repository, protected non-main sync branch, canonical public host and deployed build SHA.
- Owner-confirmed project reference for the actual application backend, reconciled with repository config.
- A named disposable/development database demonstrably isolated from production, queues, provider budgets and side effects.
- A complete migration ledger reconciliation (including Drizzle/Supabase overlap), full clean replay, authorization/RLS/privilege tests, rollback/forward-repair notes and independent review.
- Backup/restore and export rehearsal, plus an independently reviewed provider-swap test for at least maps and AI.
- An admin-confirmed active protection configuration: required approval, strict required checks, deletion protection and reviewed bypass configuration.
- No production migration, setting change, publish or deployment until a named owner explicitly authorizes that specific operation.

## Alternatives and consequences

- A dedicated owner-controlled Postgres/Supabase project offers clearer ownership and portability but requires the owner to operate monitoring, backups, networking, upgrades and spend limits.
- Keeping the current hosted backend may be lower effort, but is acceptable only after ownership, isolation, least privilege, backup/restore, export and migration authority are independently proven.
- A database/vendor migration before environment identity is reconciled is rejected: it risks changing the wrong project or losing production data.

## Human gate

The owner chooses the canonical backend, hosting/domain, repository/sync branch, budget and migration authority. A technical/security reviewer approves the schema and recovery plan. No AI agent may accept the decision or apply it unilaterally.
