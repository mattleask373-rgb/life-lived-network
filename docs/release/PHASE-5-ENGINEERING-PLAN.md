# Phase 5 Engineering Plan
**Last verified:** 2026-10-19 09:34 Europe/London (GitHub repository, PR and ruleset metadata rechecked; no live runtime or production test).  
**Verified main HEAD:** `5f06fc336a748cf37c6a06ac272bee4a387bd745`  
**Living World / Real World Atlas**  
**Date:** 2026-10-19  
**Base:** `main` @ `5f06fc336a748cf37c6a06ac272bee4a387bd745`  
**Coordination:** Issue #125

## Goal
Reach a defensible, security-tested **limited beta** for already-supported localities, with a clear, gated path to Australian expansion.

## Workstreams

### A. Conversation Security (P0)
**Owner:** TBD (recommend dedicated security-minded agent)  
**Status:** Static analysis + integration test file exist; disposable-DB proof NOT RUN  
**Acceptance criteria:**
- Participant-only read/write proven with two independent accounts on disposable DB
- No ID-guessing or cross-account leakage
- State-machine transitions enforced at DB boundary
- Safe migration + rollback documented
- CI clearly distinguishes RUN vs SKIP for the integration suite

**Dependency:** Founder decision on whether #162 is in or out of beta claims.

### B. Listing Lifecycle (P1)
**Owner:** TBD  
**Status:** Design only  
**Acceptance criteria:**
- Owner can withdraw a listing
- Expired / inactive listings are excluded from `findSupply()`
- Authorisation and basic auditability present
- No parallel discovery engine created

### C. Listing-linked Conversations (P1)
**Owner:** TBD  
**Status:** Design only — blocked on founder product decision  
**Acceptance criteria:**
- Smallest change that re-uses existing conversation tables
- Preserves all current need-linked behaviour
- Full auth and test coverage

### D. Australian Locality Expansion (P1 — separate gate)
**Owner:** TBD  
**Status:** Data-readiness specification required  
**Acceptance criteria:**
- Approved authoritative source + licence + attribution
- Canonical IDs, parent-child integrity, coordinates
- Deduplication, provenance, import preview, rollback
- Post-import verification plan
- No synthetic places

### E. Anti-spam / Abuse Protection (P2)
**Owner:** TBD  
**Status:** Proposal only; no rate limiter deployed or verified  
**Goal:** Reduce scripted spam during a limited beta without blocking legitimate help-seeking or exposing private information.

**Practical MVP design**
- Enforce limits server-side at the TanStack server-function boundary; never trust disabled buttons, client counters, or client-supplied identity as enforcement.
- Use an atomic Postgres-backed per-action / time-bucket counter (or an existing approved edge rate limiter if already configured). Any new counter table must deny direct client access through RLS and expose only the minimal server-side operation needed to increment/check a bucket.
- Proposed starting thresholds for pilot tuning (not current behavior): need creation 3/hour and 10/day per account; new connection requests 5/hour and 15/day per account, with duplicate-request protection per recipient; messages 10/minute and 60/hour per account, plus a per-conversation burst guard; reports 10/hour per account with idempotency for repeated reports against the same target. Keep safety reporting available and review any throttling that could suppress urgent legitimate reports.
- Return HTTP 429 with a useful retry message and a bounded Retry-After value. Apply progressive cooldowns to repeated abuse; do not automatically impose permanent account bans based only on a counter.
- For signed-out endpoints, use hosting/WAF controls if available plus a privacy-conscious pseudonymous network key. Do not persist raw IP addresses indefinitely; verify current platform capabilities before relying on edge protection.
- Cap payload sizes, validate schemas, reject duplicate submissions idempotently, and rate-limit before expensive database or external-provider work.
- Observe counts, rejections and latency without logging message bodies, secrets, access tokens, or raw private content. Define a short retention window and access controls for operational counters.

**Implementation sequence**
1. Inventory each public/server mutation path (create need, request connection, send message, report, login-related endpoints) and its auth requirements.
2. Confirm existing hosting/WAF protections from configuration rather than assumption.
3. Select the enforcement store and implement one atomic server-side helper with action-specific policy configuration.
4. Add tests for unauthenticated bursts, per-user buckets, duplicate calls, concurrent requests, 429/retry behavior, and legitimate users crossing locality or conversation boundaries.
5. Add minimal metrics and a documented operator response to bursts.
6. Review privacy, table grants/RLS, migration rollback and abuse-report escape hatches before any deployment.

**Acceptance criteria:** limits are enforced server-side under concurrency, signed-in identity is derived from the authenticated session, counters are inaccessible to ordinary clients, tests prove rejection and cooldown behavior, logs avoid private payloads, and the deployed provider configuration is verified separately. No code, schema, WAF or production changes are made by this proposal.
### F. Authentication & Private Routes (P1)
**Owner:** TBD  
**Status:** Source-level tests exist (#156); full two-account matrix still open (#132)  
**Acceptance criteria:**
- Signed-out, Account A, Account B, unauthorised ID, legitimate access all covered
- No private data flash before redirect

### G. Mobile & Usability (P2)
**Owner:** TBD  
**Status:** Plan only  
**Acceptance criteria:**
- Focused phone-sized checklist for core journeys
- Loading / empty / error states verified

### H. Events, SEO, Integrations (P2)
**Owner:** TBD  
**Status:** Repo-side robots.txt ready (#129); live production still unverified  
**Acceptance criteria:**
- Live `/robots.txt` and sitemap checked after authorised publish
- Ticketmaster (or any external) integration rights and keys handled correctly

## Dependencies
1. Human merge of #157 → #163 → #170 → #154 → #169
2. Explicit founder decision on #162 scope
3. Explicit founder decision on Australian data
4. Authorised publish path for SEO verification

## Risk levels
- **Critical:** Conversation isolation unproven, tracked .env, residence-as-service still on main
- **High:** Australian data UNKNOWN, live SEO unpublished
- **Medium:** Listing lifecycle and contact flows not yet designed/approved
