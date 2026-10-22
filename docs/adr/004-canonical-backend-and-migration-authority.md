# ADR 004: Canonical Backend Project and Migration Authority

**Status:** Proposed — owner confirmation and technical/security review required  
**Date:** 2026-10-22

## Context

Real World Atlas requires a backend that the owner controls, can rebuild, and can move away from a hosting vendor. The source-of-truth question is unresolved.

Evidence from the current repository and connected read-only integrations:

- Repository `supabase/config.toml` declares project reference `csgngcnaqeoxyopvnzjo`. The connected Lovable project is identified as “Real World Atlas” (project ID `b3293d2a-3218-4206-ab04-af8e984023ac`), but the connector has not established that this is the same Supabase project reference.
- The connected Lovable code branch is materially divergent from GitHub `main`: comparison at the current inspected baseline showed 270 commits on the main side absent from the Lovable branch and 16 commits unique to Lovable, with merge base `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3`. This is not a safe bulk-sync or publish target.
- The repository has a canonical `supabase/migrations/` SQL chain, while `drizzle/migrations/0000_place_memories.sql` also exists and `drizzle/schema.ts` is an auto-generated blank stub. This creates ambiguity around migration ownership and rollback.

## Proposed decision

1. **No sync or publish of the divergent Lovable branch.** Until the human owner verifies the intended repository, non-main sync branch, backend identity and published SHA, treat Lovable’s connected production/project view as read-only for operational purposes.
2. **Preferred backend:** a dedicated Supabase/Postgres project in the owner’s own organisation, with standard Postgres/PostGIS capabilities, environment-specific secrets, a documented provider-exit path, and infrastructure/configuration captured in code. Retain Lovable Cloud only if ownership, reproducibility, operational access and full exit/restore capability are demonstrably equivalent. This preference is not an accepted owner decision.
3. **One migration authority.** Provisional recommendation: use `supabase/migrations/` as the canonical SQL migration chain, because it contains most current database DDL and access policies. Before accepting this, reconcile the existing Drizzle Place Memories migration with the actual schema and migration ledger in a disposable database. Do not run both migration systems against production or discard one based on filenames alone.
4. **Provider portability:** database, map/tile, route/transit, search, AI, payment, email, media and ingestion vendors remain behind explicit interfaces. Credentials are separated by environment and are never placed in source code or logs.
5. **Rebuild and recovery are release criteria:** a fresh environment must be reconstructable from pinned configuration and a reviewed migration chain; an export/import and backup-restore rehearsal must demonstrate that the owner can leave the current platform.

## Required evidence before acceptance

- Owner-recorded confirmation of the Lovable Git repository + non-main sync branch, canonical repository, published build SHA, backend project reference and production host.
- Repository backend reference reconciled with the connector’s actual backend identity.
- A disposable environment can be provisioned from version-controlled configuration and the selected migration chain, with no credentials embedded.
- Existing Drizzle/Supabase migration overlap is resolved in an ADR supplement with a data-preserving forward path and rollback notes.
- Successful backup/restore and full export rehearsal, plus an independently reviewed provider-swap test for at least map and AI.
- No production write, migration apply or deployment before named human approval.

## Consequences and alternatives

- A dedicated owner-controlled project has clearer ownership and portability, but entails operating staging/production separation, monitoring, backups, networking, upgrades and spend.
- Keeping the current hosted backend is lower effort now, but only acceptable if the owner can independently prove isolation, privileges, backup/restore, migration ownership, export and exit conditions.
- A full database/vendor migration before current-project identity is reconciled is rejected; it risks data loss and the wrong production target.

## Human gate

The owner must choose the canonical backend, repository/branch, domain/host, infrastructure budget and migration authority. The technical reviewer must approve the migration ledger and restore plan. No AI agent may accept or apply the decision unilaterally.
