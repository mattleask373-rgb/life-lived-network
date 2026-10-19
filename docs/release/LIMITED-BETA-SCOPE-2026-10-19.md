# Limited Beta Scope — One-Pager
**Living World / Real World Atlas**  
**Date:** 2026-10-19  
**Status:** Conditional — pending human merges of P0 PRs

## What is in scope (once P0 merges land)

- Discovery powered by the single canonical `findSupply()` engine
- Explicit service-area matching only (residence alone is not reach)
- Exact open-need counts and fail-closed locality scope
- Validated need creation with canonical place derivation
- Configurable default locality (no country hard-coding)
- Honest empty / quiet locality states
- Already-supported place hierarchy (currently UK & Ireland)

## What is explicitly out of scope

| Item | Reason |
|------|--------|
| Australian coverage | No verified place records in repository; live DB status UNKNOWN |
| Production-proven conversation isolation | Disposable-DB proof for #162 not executed |
| Live production SEO (robots.txt / sitemap) | Repo fix exists; live publish + check still required |
| Listing-linked conversations | Product decision pending |
| Live external event feeds (e.g. Ticketmaster) | Not required for limited beta |
| Any traction, revenue, or partnership claims | Not measured / not evidenced |

## Defensible public statement

> We are preparing a limited beta for localities that already have real place data. The product uses one canonical discovery engine and explicit service-area semantics. Critical correctness and hygiene fixes are ready for merge. Australian coverage and full conversation-isolation proof remain separate gates. We will expand only when the data and safety evidence is in place.

## Go / No-Go summary

**NO-GO** for broad or Australia-inclusive launch.  
**CONDITIONAL GO** for limited beta on already-supported localities after:
1. Ordered merge of #157 → #163 → #170 → #154 → #169
2. Explicit decision to exclude #162 from security claims (or complete disposable-DB proof)
3. Explicit decision to keep Australia out of scope

## Owner
Human release owner. This document does not authorise merges or production changes.
