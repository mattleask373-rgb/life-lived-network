# Google Meeting Brief — Living World / Real World Atlas
**Date prepared:** 2026-10-19  
**Status:** Evidence-based only. No fabricated traction, revenue, partnerships or launch claims.

## A. Product explanation

**Problem:** People want to discover real work, experiences, community, music and human connection in the places they actually live or travel — without addictive feeds, fabricated listings or opaque ranking.

**Solution:** A locality-first discovery platform whose north star is “life lived, not screen time.” The core interface is a living map of genuine human activity, grounded in a single canonical discovery engine (`findSupply()`) and an explicit service-area model.

**How it distinguishes real from unknown:**
- Residence is never automatically treated as willingness to serve (fix in unmerged #163).
- Open-need counts use exact database counts and fail closed (PR #154).
- Empty / quiet localities are stated honestly; nothing is invented to fill the map.
- Fixtures are gated and must not appear as production supply.

## B. Verified demonstration (what can actually be shown)

1. Open the published app or a green CI build of current main + the ready PRs.
2. Select a supported locality (UK & Ireland hierarchy is present).
3. Observe honest empty / quiet states when no qualifying records exist.
4. Walk a need or opportunity that has real provenance and explicit service area (once #163 is merged).
5. Show the configurable default-locality path (#170) as the mechanism for future market activation.

**Fallback if live data is sparse:** Demonstrate the architecture, the honesty invariants, the green Verify runs on the critical PRs, and the clear remaining data gates. Do not show synthetic Australian places.

## C. Technical differentiation

- Single deterministic discovery engine — no second matcher.
- Country-agnostic hierarchical geography with explicit service-area semantics.
- Privacy-aware design: private routes, conversation isolation, least-privilege intent.
- Configurable pilot default without hard-coding any country.
- Reusable platform for additional markets once real place data and operational readiness exist.

## D. Current proof

- Exact-head Verify SUCCESS on #157, #163, #170, #154, #169, #166, #129.
- Independent code reviews posted on the critical PRs.
- Strong unit-test coverage of the discovery and validation paths.
- Conversation isolation has source-level + static migration tests; full disposable-DB proof still outstanding.

## E. Open risks (transparent)

| Risk | Status |
|------|--------|
| Tracked `.env` on main | Open — merge #157 |
| Residence-as-service on main | Open — merge #163 |
| Australian place / supply data | UNKNOWN — absent from repo |
| Conversation least-privilege migration | Disposable-DB proof NOT RUN |
| Live robots.txt / sitemap | Repo fixed; production still platform default |
| End-to-end private-route matrix | Partially covered; #132 still open |

## F. Discussion with Google — suggested focus

Possible concrete objectives (pick what matches the actual meeting):
- Technical feedback on the canonical discovery + service-area model.
- Architecture guidance for multi-market geography and data provenance.
- Cloud / data / maps product fit (if relevant).
- Honest assessment of what would be required for a credible pilot in a new market.

**Questions that stay appropriate:**
- How would you evaluate the honesty / provenance guarantees of a locality-first discovery system?
- What data-quality or rights-management patterns have worked for similar place-based platforms?
- Where do you see the highest risk in expanding a country-agnostic model into a new market?

**Do not claim:** Google endorsement, partnership, funding, validation, or any metric that has not been measured.

## Recommended meeting narrative

“We have built a deliberately constrained, truth-seeking discovery engine and a country-agnostic geography model. The critical correctness and security fixes are written, tested, and independently reviewed. The remaining work is human merge gates, disposable-database proof for conversation isolation, and acquisition of real place data for any new market. We would rather show a smaller, honest scope than a populated map that is not real.”
