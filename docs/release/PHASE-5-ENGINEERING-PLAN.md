# Phase 5 Engineering Plan
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
**Status:** Audit + proposal  
**Acceptance criteria:**
- Enforceable limits on messages, requests, reports
- Identity-aware controls where appropriate
- Sensitive data kept out of logs

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
