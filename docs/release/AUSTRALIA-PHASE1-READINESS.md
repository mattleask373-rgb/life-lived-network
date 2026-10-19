# Australia Phase One — Release Readiness Report

**Audit date:** 2026-10-19  
**Base:** `main` @ `5f06fc336a748cf37c6a06ac272bee4a387bd745`  
**Auditor:** Grok (external collaborator via GitHub)  
**Scope:** Finish Australia Phase One readiness and leave architecture ready for staged international expansion.  
**Authority:** Read-only audit + documentation only. No merges, no production changes, no credential rotation, no schema/RLS changes.

---

## 1. Repository identity

| Item | Value |
|------|-------|
| Authoritative repo | `mattleask373-rgb/life-lived-network` |
| Default branch | `main` |
| Current main SHA | `5f06fc336a748cf37c6a06ac272bee4a387bd745` (2026-10-12) |
| Lovable linkage | Active (`.lovable/`, lovable-dev[bot] commits) |
| Second repo | `life-lived-network2` exists — **do not use** unless founder explicitly switches source of truth |
| Verify workflow | Present and green on the key PRs listed below |

---

## 2. P0 Blocker Register (must resolve before pilot)

| ID | Blocker | Evidence | Impact | Ready PR | Next action |
|----|---------|----------|--------|----------|-------------|
| P0-1 | Tracked `.env` on main | Root `.env` still in tree | Credential exposure risk | **#157** (head `d7b4c594…`) | Human review + merge. Then decide history scrub / rotation. |
| P0-2 | Residence treated as service coverage | `geo-scope.ts` still returns `lives_here` | Violates core invariant LIVING IN PLACE ≠ SERVING PLACE | **#163** (head `3fb33ac0…`, green Verify) | Review semantic change + merge. |
| P0-3 | Open-need counts + fail-closed scoping | List length used as total; unscoped queries possible | Misleading zeros / potential over-fetch | **#154** | Review + merge; coordinate with #169. |
| P0-4 | Conversation least-privilege + state machine | Broad table grants; missing transition guards | Private conversation risk | **#162** (draft) + **#161** | SQL review + disposable two-account proof required before any migration apply. |
| P0-5 | Need submission validation / canonical place | Client-supplied place data trusted | Locality spoofing | **#169** (head `d7006d4d…`) | Review Zod bounds + merge after/with #154. |

---

## 3. Australia Phase One Acceptance Matrix

| Criterion | Status | Notes |
|-----------|--------|-------|
| Canonical Australian geography hierarchy (country → state/territory → city → locality + coords, timezone, currency) | **UNKNOWN** | No AU records found in code search. Model is data-driven and country-agnostic (`src/lib/places.ts`). Aggregate verification against approved environment required. Do **not** invent records. |
| Pilot/default region configurable without hard-coded country branching | **PARTIAL** | `DEFAULT_PLACE_SLUG = "uk-and-ireland"`. Worldwide model exists; AU selectable once data loaded. |
| User can select Australian locality from canonical data | **NOT RUN** | Depends on data existence. |
| Search retains locality + intent | **PARTIAL** | PRs #160 / #166 address. |
| Results show accurate provenance / freshness / uncertainty | **PASS (architecture)** | Single canonical `findSupply()`; honesty labels present. |
| Actions work or clearly explain unavailability | **NOT RUN** | End-to-end required. |
| Quiet locality shows honest empty state + useful next step | **PARTIAL** | PR #158. |
| Private profiles / locations / conversations protected | **PARTIAL** | Source guards + #156/#161/#162; live two-account matrix outstanding (#132). |
| Mobile + low-bandwidth usable | **NOT RUN** | |
| No demonstration fixtures leak into production | **PARTIAL** | PR #165. |
| Residence ≠ service coverage | **FAIL on main** → **PASS after #163** | |

**Definition of done not yet met.** Critical security and discovery blockers lack evidence-backed resolution on main; genuine Australian geography and supply not verified; end-to-end acceptance not executed.

---

## 4. Priority merge sequence (human-gated)

1. **#157** — env hygiene (lowest risk, highest hygiene urgency)
2. **#163** — explicit service-area only (core truthfulness)
3. **#154** + **#169** — exact counts / fail-closed + need validation (shared file; merge carefully)
4. **#162** + **#161** — conversation security (SQL + disposable DB proof mandatory)
5. Supporting: #156, #129, #165, #158, #166, #168, #153

All listed PRs currently report `mergeable_state: blocked` (likely required reviews / branch protection). CI Verify is green on the key heads where checked.

---

## 5. Global expansion readiness (architecture already present)

- Canonical `findSupply()` is the sole discovery engine.
- Hierarchical place model is country-agnostic.
- Provider-neutral ingest boundary exists.
- Honesty invariants (unknown ≠ zero, fixtures gated, no fabrication) are codified.

Still required for expansion: AU (or other) place data load, configurable pilot region, full i18n/locale, pagination limits, rights-checked external providers, accessibility baseline.

---

## 6. Founder decision list (required before any claim of launch readiness)

1. Confirm this repository remains source of truth.
2. Authorise merge of #157 (and any subsequent history scrub / rotation plan).
3. Authorise review + merge sequence for #163 → #154/#169 → #162/#161.
4. Approve disposable-environment application of conversation hardening migration.
5. Authorise (or supply) genuine Australian place hierarchy data load / verification access.
6. Complete or explicitly waive remaining #132 launch-QA matrix.
7. Explicit approval required for any production deploy, OAuth change, secret rotation, or external provider activation.
8. Engage Australian legal counsel on privacy, account deletion, commercial messaging, consumer representations, UGC, and work/opportunity listings. Do not publish new legal terms without approval.

---

## 7. Safety statement

This document and the accompanying STATUS update contain **no code changes**, no migrations, no production data access, and no claims of launch readiness. Australia Phase One becomes ready for a human release decision only when the P0 items have evidence-backed resolution on main, genuine geography and supply are verified, end-to-end acceptance passes, and the legal questions are answered.
