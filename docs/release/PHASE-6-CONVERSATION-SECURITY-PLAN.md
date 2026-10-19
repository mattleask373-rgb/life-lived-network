# Phase 6 — Conversation Security Remediation Plan
**Last verified:** 2026-10-19 09:34 Europe/London (GitHub repository, PR and ruleset metadata rechecked; no live runtime or production test).  
**Verified main HEAD:** `5f06fc336a748cf37c6a06ac272bee4a387bd745`  
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


## 7. Implementation-ready safe test rewrite (plan only; not implemented here)

### 7.1 Gate before any database connection
The test file must evaluate the safety gate before importing or constructing the database client.

- Without RUN_CONVERSATION_DB_TESTS=1, emit an unmistakable "SKIP: conversation DB integration tests not opted in" result and make **zero database connections**.
- If the opt-in is 1 but any required target setting is absent or invalid, fail closed with a non-zero exit. Do not silently skip a misconfigured, explicitly requested run.
- Require DISPOSABLE_DATABASE_URL and CONFIRM_CONVERSATION_TEST_DATABASE=life-lived-conversation-test-only.
- For the first implementation, accept **loopback hosts only** (localhost, 127.0.0.1, or ::1) and require the database name life_lived_conversation_test. Reject all other database names and hosts before connecting; explicitly reject Supabase-hosted domains and any production/shared endpoint. Remote ephemeral databases are out of scope for this initial harness.
- Once connected, query current_database() and confirm the exact expected database name before writing anything. Do not use a default URL, a fallback to postgres, or values loaded implicitly from the application's normal environment.

### 7.2 Fixture ownership and cleanup
1. Generate a unique test-run identifier and unique fixture identifiers at the start of each run.
2. Create only the users and rows required by this run, using the project's real constraints and supported auth setup.
3. Track every inserted primary key and test-created auth user explicitly in the fixture owner.
4. In finally, delete only those fixture-owned rows and users in dependency order, by their recorded IDs. Use a transaction where compatible; where auth setup crosses a transaction boundary, retain an explicit cleanup ledger and report cleanup failure as a test failure.
5. Never run TRUNCATE, TRUNCATE ... CASCADE, whole-table deletes, schema resets, or global cleanup against application tables. Never attempt automatic cleanup of data not created by this run.

### 7.3 Minimum two-/three-account matrix
- Account A can access only the conversation and messages it is authorised to access.
- Account B can access its own authorised conversation but cannot read or mutate A's private data unless an explicit participant rule permits it.
- Account C, an unrelated authenticated account, cannot read, send, alter status, block, or report through IDs belonging to A/B unless that operation is intentionally allowed by policy.
- An unauthenticated caller cannot read or mutate private conversation data.
- A non-participant cannot send messages; participants cannot write after the conversation is closed/settled.
- Recipient accept/decline, sender withdrawal, context immutability, and no-reopen rules are asserted at the database boundary where the schema implements them.

For every forbidden action, assert both the result and that no unintended row changed. Avoid tests that pass just because the client UI hides an action.

### 7.4 Honest result semantics and command
- Missing opt-in = **SKIP**, with zero database connections.
- Opt-in enabled but unsafe/missing target configuration = **FAIL**, before any connection.
- Valid disposable target and all assertions pass = **PASS**.
- Assertion or fixture-cleanup failure = **FAIL**.

With the local disposable database already created, configured and verified, the run command is:

    RUN_CONVERSATION_DB_TESTS=1 bun run test src/lib/connection-policy-db.integration.test.ts

Set DISPOSABLE_DATABASE_URL and CONFIRM_CONVERSATION_TEST_DATABASE in the local shell without putting their values in source control. Never print a connection string, credentials, message bodies, or private fixture contents. The current harness has **not** been run or rewritten by this documentation change.

### 7.5 Acceptance evidence before any security claim
Attach the exact commit SHA, command, exit code, test-run summary (including an explicit PASS rather than SKIP), the confirmed disposable database type, and the A/B/C results. Independently review the migration's grants, trigger functions, RLS interaction, and cleanup behavior. Only the founder may decide whether or when a migration is applied to a hosted environment.
