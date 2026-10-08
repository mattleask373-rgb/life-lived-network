# Backend Reference Audit and Durable Executor Design (read-only findings + staged plan)

Nothing was edited, migrated, deployed or changed. I did **not** access `caaosyevvdhxwsrqhqur`; every statement about it below is a requirement, not an observation.

## 1. What I verified in this checkout

**The current project is bound to `csgngcnaqeoxyopvnzjo` by Lovable Cloud, not by hand-written config.**
- `.env` (tracked in git) — project ID, publishable key and URL point at the old project. The URL values are real addresses (a Lovable Cloud proxy host), **not placeholders** as suspected; the inspection that showed placeholders was likely of a different copy or a masked view.
- `supabase/config.toml` — `project_id` = old project. Auto-generated.
- `supabase/migrations/` — 35 migration files define all 21 application tables, RLS policies, the `app_role` enum, `has_role`, `is_safety_reviewer`, `handle_new_user` (trigger on new signups) and the touch/updated-at triggers.
- Storage: one private bucket, `profile-photos`.
- Auto-generated, must not be hand-edited: `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `types.ts`, `previewAuthStorage.ts`.
- Hand-written reader: `src/lib/supabase-public.server.ts` (reads `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`).
- `src/start.ts` registers the bearer-token middleware.
- About 25 app files call the backend (needs, capability, connection, moderation, ingest, journey, hours, places, listings, profile, auth, life-list, profile-photo, etc.). None hardcode a project ID; all go through the clients above.

**Secrets referenced by name only (values not read):**
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_CRON_SECRET`, `LOVABLE_CRON_SECRET_PREVIOUS` (optional), `TICKETMASTER_API_KEY` (not set), `WORLD_FIXTURES`, `NODE_ENV`. Also configured: `GITHUB_API_KEY` (connector-managed), `LOVABLE_API_KEY`, `SUPABASE_DB_URL`, `SUPABASE_JWKS`, publishable/secret key sets.

**Data tied to the old project (historical counts, re-check before switching):** 221 places, 2 sources, 0 accounts/profiles/listings/needs. Auth users, the signup trigger, auth provider settings (email, Google), email sender, storage objects and scheduled refresh jobs all live there.

## 2. The blocking fact

This project runs on **Lovable Cloud**, which cannot be disconnected or re-pointed to another backend project from inside Lovable. Editing `.env`, `config.toml` or the generated clients will be overwritten and would split preview/published behaviour. So "point Real World Atlas at `caaosyevvdhxwsrqhqur`" has only these honest options:

```text
A. Keep Cloud as canonical      -> declare csgngc... canonical instead (lowest risk)
B. New Lovable project on the   -> remix/new project connected to the target backend,
   target backend                  copy code, replay migrations, migrate data
C. Self-host outside Lovable    -> export via GitHub, set env vars to target, deploy elsewhere
```
Owner decision required before any work. Who confirmed `caaosy...` as canonical, and whether it already holds data, is unverified.

## 3. If switching (option B or C): exact changes

1. Target backend: replay all 35 migrations in order; confirm 21 tables, RLS enabled on each, policies, grants, enum, 4 functions, `on_auth_user_created` trigger, `profile-photos` bucket (private) and its storage policies.
2. Data: export and import `places` (221) and `sources` (2); auth users only if any exist by then.
3. Auth settings on target: email signup + confirmation, Google provider, redirect URLs for preview and published domains, email sender.
4. Secrets on the new host: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_CRON_SECRET`, optional `TICKETMASTER_API_KEY`, `WORLD_FIXTURES` unset in production.
5. Frontend env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.
6. Regenerate `types.ts` from the target and diff against current (also settles the known listing-kind mismatch).
7. Remove tracked `.env` from git (keep it ignored).
8. Cron jobs calling the refresh endpoint: recreate against the new host with the new cron secret.

## 4. Checks before switching
- Schema diff old vs target is empty (tables, columns, policies, functions, triggers, buckets).
- Security linter clean on target; anonymous user cannot read private tables.
- Signup creates a profile row; resend-confirmation email arrives.
- Row counts for places/sources match.
- Full test suite, typecheck, lint, build green against target.
- Published site smoke test: map, locality page, sign-in, profile photo upload, need creation.

## 5. Backup and rollback
- Before: full data export of old project; keep old project untouched and running (read-only freeze for writes during cutover).
- Cutover via env change only; no destructive migration on either side.
- Rollback: restore previous env values / previous deployment; old project still holds authoritative data. Any rows written to target during the window are exported and reconciled by hand.
- Keep old project for at least 30 days after switch.

## 6. Agent control plane: current state (verified from docs)
- `docs/agents/` defines lifecycle, claim/lease/heartbeat, handoff, lanes, invariants, observability.
- `STATUS.md` (2026-10-07) states plainly: **persistent executor MISSING**. PRs #61, #62, #64, #67, #69, #72, #73 and issue #74 are listed open (PR states not re-verified — GitHub access was previously denied).
- No `agent_tasks`/`agent_events` tables exist in the current backend.

## 7. Proposed staged durable executor (design only)

```text
Stage 0  Decide backend (section 2). Nothing else first.
Stage 1  Persistence: agent_tasks, agent_runs, agent_events, agent_approvals
         - RLS: admin-only read/write via has_role; no public access
         - lease_expiry, last_heartbeat, fencing_token (monotonic int)
Stage 2  Claim/heartbeat as server functions with a single SQL claim
         (UPDATE ... WHERE status='READY' OR stale RETURNING, token++)
         Every write must present the current fencing token or is rejected.
Stage 3  Executor loop: cron-triggered route, verifies cron secret,
         picks one task, runs bounded step, heartbeats, records event.
         Retries: max 3 with backoff; 3 identical failures -> BLOCKED + diagnosis task.
Stage 4  Observability page (admin only): queue, active, stale, blocked,
         failures, metrics from OBSERVABILITY.md, derived from agent_events.
Stage 5  Human gates: agent_approvals row (approver, scope, expiry) required for
         ACCEPTED->INTEGRATED, security/privacy, schema, external side effects.
         Executor may at most open a PR; it holds no merge or deploy credential.
```
Invariants kept: no autonomous merge/deploy, no force-push, no secrets in events, independent review before ACCEPTED, no second discovery engine.

## Decisions needed from you
1. Option A, B or C for the backend.
2. Whether `caaosy...` currently holds any data or users.
3. Approval to start Stage 1 only after the backend decision.
