# Wide-area opportunity retrieval — design proposal

**Status:** Draft design contract; not an implementation or release approval  
**Date:** 22 October 2026  
**Canonical main reviewed:** `a99d09f1517523a7a388245ca6b3d5c1245816cb`  
**Related work:** #263, #279, #100, #164, PR #291  
**Owner:** Product/engineering owner to assign before implementation

## 1. Problem and evidence

The current implementation of `getMyOpportunities()` in `src/lib/needs.functions.ts`:

1. derives a person's stated home/service/travel places;
2. expands those places to descendant IDs using `loadPlaceIndex()`;
3. applies a `place_id IN (...)` filter when the resulting unique list has at most 400 IDs;
4. when the list is larger, omits the place predicate and reads only the globally newest 60 public/local-discovery needs;
5. passes those rows to the existing `findOpportunitiesForPerson()` evaluator, which still checks actual geography, capability, visibility, time and journey semantics before returning a match.

This is not evidence of a cross-locality disclosure: the canonical evaluator still applies geographic reach. It is a completeness and ranking-bias risk. A legitimate match can be absent from the newest 60 global rows and therefore never reach the evaluator. A caller may mistake a bounded candidate window for a complete view.

The 400-ID limit exists for a reason. Removing it or increasing it without a measured query plan is not a safe solution. Neither is an unbounded global scan.

## 2. Required invariants

The solution must preserve all of these invariants:

- `findSupply()` remains the single need-to-supply discovery authority. `findOpportunitiesForPerson()` remains the existing reciprocal evaluator; retrieval must not become a second matcher or ranking system.
- Service area, home location, “travelling through”, and a shared opted-in journey remain distinct facts. Passing through a place is not service availability. Travel-specific matches still require the existing journey opt-in, place overlap, and time semantics.
- The server derives the real geography and current authorization. Client-supplied descendant IDs are not proof of scope.
- Public/local-discovery visibility, excluding the signed-in owner's own needs, block filtering, open status and existing policy/regulatory caveats remain enforced.
- Failed, malformed, stale or incomplete hierarchy/candidate reads must never silently mean “there are no opportunities” or “all results were checked.”
- Every database request is bounded by a row cap, timeout/cancellation policy and resource budget. Any capped result set must be labelled incomplete or fail closed; the product must not imply completeness without proof.
- Stable ordering uses a deterministic tie-breaker. Duplicate records across batches must be removed by stable identity without changing authorization or result semantics.
- No new public endpoint, privilege elevation, `SECURITY DEFINER` function, RPC grant, migration, index, RLS policy or hosted setting is authorized by this proposal.

## 3. Options to compare before selecting an implementation

### A. Bounded chunk retrieval plus deterministic merge

Expand the authoritative hierarchy server-side, split IDs into bounded chunks, retrieve a bounded and stable candidate window per chunk, deduplicate by need ID, merge deterministically, then call the canonical evaluator.

Advantages: can reuse the current schema and read boundary. Risks: query fan-out can grow with global hierarchy size; per-chunk top-N selection can fail to return the global best candidates unless the merge/continuation contract is defined; concurrent inserts/updates can move candidates between pages; query budget and partial completeness must be explicit. This option is acceptable only if worst-case fan-out and partial outcomes are bounded and measured.

### B. Hierarchy-aware server/database query

Use a server-owned recursive hierarchy query or a carefully reviewed RPC to express the locality and descendant relationship without serializing thousands of place IDs into a PostgREST `IN` list.

Advantages: potentially avoids query fan-out and can make server-side filtering/index use clearer. Risks: requires a concrete query plan, RLS-aware testing, migration/permission review, exact function grants and real preview/disposable-database verification. A privileged function must not bypass caller visibility/block rules or return private needs.

### C. Explicit bounded partial results

Keep a hard limit and return an explicit status/continuation token when the server cannot prove that the candidate window is complete. The UI may show verified matches found so far but must say that more results may exist and offer a safe narrowing/widening action.

Advantages: safest fallback when completeness cannot be guaranteed under a fixed budget. Risks: needs a clear typed response contract and UI/analytics semantics; it must not be represented as zero opportunities or a complete result set.

**No option is selected by this draft.** The implementation agent must compare all three against current query plans, RLS, expected hierarchy size, fan-out, cost, cancellation and user-facing semantics before proposing code.

## 4. Acceptance criteria

### Correctness and scope

- Unit/property tests for scopes at 1, 400, 401, several thousand and the maximum configured hierarchy; repeated IDs must not change the measured scope.
- A relevant need outside the globally newest 60 must still be considered when it lies inside the person's stated valid scope, or the result must be explicitly labelled incomplete and offer continuation/narrowing.
- A need outside stated service area must never appear as a service-area match. A travelling-through relation alone must not qualify it.
- Only active/opted-in journeys satisfying the existing place/time overlap can produce a travelling possibility.
- Private, closed, expired, withdrawn, own, blocked or policy-ineligible needs remain excluded.
- Query failures, missing count/provenance, cap overflow, duplicate IDs, tied sort timestamps and mid-pagination inserts/updates have explicit tested outcomes. Unknown is not silently converted to a successful zero.
- Pagination uses a deterministic tuple/cursor (for example, timestamp plus immutable ID) and is resistant to duplicate/missing records to the extent promised by its consistency model. The API documents that keyset paging alone is not a transaction snapshot.

### Security and operations

- Anonymous/authenticated role tests preserve current RLS. Cross-user isolation, block filtering, hidden needs and own-need exclusion are tested against a disposable/isolated DB.
- Per-request query count, rows scanned, latency, cancellation and maximum resource cost are bounded and measured. No user-controlled input can remove the server-derived locality predicate.
- Errors are logged with redacted, low-cardinality diagnostics; no need text, private profile data or exact sensitive location is added to logs.
- UI clearly separates “no eligible matches found in a complete check” from “could not check” and “more candidates may exist.”
- Fresh exact-head Verify, TypeScript analysis, CodeQL and locked dependency audit pass. A database path needs preview/disposable DB tests; current Supabase Preview is skipped by repository configuration, so it cannot count as passed.
- Independent code/security review and keyboard/mobile/screen-reader review are recorded before integration.

## 5. Rollout, rollback and gates

1. Record the current baseline and add tests/measurement to a reviewable branch.
2. Test against synthetic hierarchy fixtures and an isolated disposable database with realistic large locality sets, stable cursors, RLS and adversarial data changes.
3. Compare query plans, request fan-out, row counts and worst-case cost for options A/B/C. Select only after independent review.
4. Add a feature flag or server-side kill switch if introducing a new retrieval/RPC path. Keep the current matcher and existing permission checks authoritative.
5. Deploy only after owner confirms the target host/backend and explicitly approves the release. Verify through read-only observation first; no production load test or data/schema write is implied.
6. If completeness, RLS, query cost or latency fails the agreed thresholds, disable the new path and use a known bounded fallback that explicitly discloses partial results.

## 6. Explicit non-goals

This work does not enable public AI, create/activate providers or source feeds, change paid-work/legal policy, invent supply, create a second matcher, mutate production, alter RLS/grants or authorize deployment. It does not claim worldwide data completeness or billion-user capacity.

## 7. Next handoff

The implementation PR must identify the chosen option, current exact main SHA, changed paths, query plan, RLS proof, cursor/completeness contract, worst-case budget, test/CI links, UI partial-result copy, rollback plan, and the human approvals still required. If the environment/authorization gate is unresolved, continue with pure tests and documentation rather than guessing the target database.
