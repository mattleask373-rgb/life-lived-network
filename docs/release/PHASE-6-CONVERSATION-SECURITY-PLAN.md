# Phase 6 — Conversation Security Remediation Plan
**Date:** 2026-10-19  
**Related PR:** #162 (currently draft)  
**Status:** Design + contract only. No migration applied. No disposable-DB run performed.

## 1. Goal
Make private conversation, message, block, and report behaviour least-privilege and participant-scoped, with evidence that can be trusted for a limited beta claim.

## 2. Current evidence

| Layer | Status |
|-------|--------|
| Migration SQL (least-privilege grants + triggers) | Present on #162 branch |
| Static migration contract tests | Present |
| Integration test file | Present on #162 branch; previously observed to use broad `TRUNCATE ... CASCADE` and default toward a generic `postgres` database |
| Disposable-DB execution | **NOT RUN** |
| Production application of migration | **NOT DONE** |

## 3. Required safety contract for any integration test

Any database integration suite for this feature **must**:

1. Require an **explicit opt-in** environment variable (e.g. `RUN_CONVERSATION_DB_TESTS=1`).
2. Require an **explicit disposable connection string** (e.g. `DISPOSABLE_DATABASE_URL`). Refuse to run if missing or if the URL looks like a hosted/shared/production target.
3. **Fail closed** if the target cannot be positively identified as disposable.
4. **Never** use table-wide `TRUNCATE ... CASCADE` on application tables.
5. Create only test-owned fixtures and clean them up narrowly (by known test IDs).
6. Distinguish clearly in output between:
   - Suite skipped (missing opt-in or disposable DB)
   - Suite ran and passed
   - Suite ran and failed
7. Never print credentials, full connection strings, or message bodies in logs.
8. Cover at minimum:
   - Account A can read/write its own authorised conversation
   - Account B can read/write its own authorised conversation
   - Account C (unrelated) cannot read or write either
   - Unauthenticated requests are denied
   - Closed / settled conversations reject further writes
   - Status transitions respect the state machine (recipient accept/decline, sender withdraw, no reopen)
   - Context columns are immutable after insert

## 4. Recommended implementation steps (when founder authorises)

1. **Independent SQL review** of the migration on #162 (grants, trigger functions, interaction with existing RLS and `touch_updated_at`).
2. **Rewrite the integration test** to the safety contract above (opt-in + disposable URL + narrow cleanup).
3. **Run the suite** against a confirmed local or ephemeral disposable Postgres.
4. Post the exact command, exit code, and summary of assertions in issue #125.
5. Only after green disposable-DB evidence + SQL review should the founder consider merging #162 and applying the migration to a non-production target first.

## 5. Limited-beta recommendation

Until steps 1–4 are complete:

- Treat conversation isolation as **NOT database-proven**.
- Explicitly exclude “production-proven conversation security” from any limited-beta or Google-meeting claims.
- The rest of the limited beta (discovery truthfulness, exact counts, configurable locality, honest empty states) can still proceed once the P0 merges land.

## 6. Out of scope for this document
- Applying the migration to any hosted database
- Changing production grants or RLS
- Running the current integration test as-is against any database
- Claiming the security property is verified

**Owner of final apply decision:** Founder only.
