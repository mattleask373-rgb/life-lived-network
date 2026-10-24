# Current Priorities — Evidence-Gated Execution

**Snapshot:** 2026-10-24 12:26 UTC  
**Current main:** 182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f  
**Operating mode:** security-first, no public surface expansion while Gates 0 and 4 remain open.

## Highest-priority dependency order

### P0-A — Confirm authoritative environment identity (owner/admin)
Required: exact Lovable Git target + protected non-main sync branch; canonical host and deployed build SHA; production Supabase project ID; separate disposable Supabase project. Until verified, do not sync Lovable, change hosted settings, inspect/write private production rows, run load tests, or republish.

### P0-B — Close the local_discovery boundary in code and disposable evidence
Keep the existing candidate chain together, review each exact head, and re-run the combined disposable matrix after dependency reconciliation:
1. [#348 — verified locality boundary](https://github.com/mattleask373-rgb/life-lived-network/pull/348), head `8b91b6b0dcfd564bd2265783b4c4327da9077280`, base main `182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f`. Verify [#40093067234](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40093067234): lint, Vitest, build, empty local migration replay, pgTAP creator-policy bypass regression, direct PostgREST RLS, DB function lint and k6 **PASS**; final strict dependency gate **FAIL** as intended. CodeQL [#40093067082](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40093067082): JS/TS analysis passed, locked audit failed.
2. [#350 — scoped personal facts](https://github.com/mattleask373-rgb/life-lived-network/pull/350), head `1d9dda353d79fea962207294e8784483b83c425c`, stacked on #348. Verify [#40093505114](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40093505114): lint/tests/build, empty local migration replay, pgTAP, PostgREST RLS, DB lint and k6 **PASS**; final audit gate **FAIL**.
3. [#352 — authenticated local reads](https://github.com/mattleask373-rgb/life-lived-network/pull/352), head `4961076dd68379418518b6e1683c01b6caf66862`, stacked on #350. Verify [#40093578097](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40093578097): lint/tests/build, empty local migration replay, pgTAP, PostgREST RLS, DB lint and k6 **PASS**; final audit gate **FAIL**.
4. [#354 — audited membership provisioning](https://github.com/mattleask373-rgb/life-lived-network/pull/354), head `74f86db58f796ed709f45ebe57e7f6c1d1227598`, stacked on #352. Verify [#40093582425](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40093582425) **PASS** including local replay, pgTAP, PostgREST, DB lint and k6. Important: this branch’s lock blob is the same patched dependency lock as #353 (`a60fa15ac9e6859f901350fd02ddad877fa8834a`); this explains its clean audit but creates duplicated dependency changes in the stack. Do not use this to bypass #353’s review.
5. All of #350/#352/#354 include the corrected shared boundary migration/test blobs `5670800d8fd21d7718e643febe5e93d0fff962f2` / `e7b39ee5a8f999e2a9abd800b193aaf6e556f3e2`. This regression prevents the old creator SELECT policy from bypassing verified membership through permissive-policy OR composition.
6. Independent security review remains required for effective RLS/grants, SECURITY DEFINER privileges, service-role boundary, membership lifecycle (expiry policy is not implemented), provisioning authority, and the list → detail → supply contract.

Do not merge a partial slice that makes local_discovery disappear into an unexplained empty state or reopens an anonymous read fallback. Preserve truthful distinction between no eligible rows and a failed/unauthorized read.

### P0-C — Dependency gate and exact-head verification
- [#353 — Zod 4.6.7 / Undici 7.30.1 security remediation](https://github.com/mattleask373-rgb/life-lived-network/pull/353), head `7e63c7e385ed1fc8c6c380eca3967cb85cafad51`: Verify [#40085945708](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40085945708) and CodeQL [#40085945605](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40085945605) pass on that head. It remains unmerged and has no independent APPROVE review; current owner/admin enforcement of main protection is disabled, so both governance and reviewer gates remain open.
- Dependency overlap is concrete: #348/#350/#352 currently use lock blob `106f982662d4689dbc2ccd94cf820bfaf479259b` with `undici@7.30.0`, while #353 and #354 use lock blob `a60fa15ac9e6859f901350fd02ddad877fa8834a` with `undici@7.30.1`. Integrate/reconcile #353 first after admin protection is restored; forward-update the locality stack without reverting the patch.
- [#351 — fail closed on incomplete row reads](https://github.com/mattleask373-rgb/life-lived-network/pull/351), head `64fda4c94010fb4d8ed6cebf752f2270bf20ac4f`: Verify [#40092610365](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40092610365) lint/tests/build/k6 passed; final dependency gate failed; database steps skipped on its source-only change. Current-head CodeQL has not been established in this snapshot.
- Never treat cancelled/old-head checks as current green status.

### P0-D — SEO parity and public/private route policy
- [#335 — sitemap completeness and live verification](https://github.com/mattleask373-rgb/life-lived-network/pull/335), head `a6a309821cde6f2509fc5d04686d5c7de1bf412a`, temporarily based on #358 diagnostics. Verify [#40092565854](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/40092565854) lint/tests/build/k6 passed; final audit gate failed; CodeQL is not refreshed on this exact head. Restore canonical `main` and rerun after #353/#358 are integrated in the approved order. Live-host verification remains blocked on Gate 0.
- Do not weaken smoke assertions. First confirm canonical host/build and authorize republish, then test the exact host with GET-only checks.
- [#355 — live SEO gap evidence](https://github.com/mattleask373-rgb/life-lived-network/pull/355) is a new docs-only draft based on current main. The report records its own ~22:12 UTC probe: `GET /robots.txt` returned 200 with generic Allow-only rules and no Sitemap directive; `GET /sitemap.xml` returned 404. Treat that as agent-reported, source-linked evidence, not independent verification by this session. It does not authorize a republish. Review it alongside #335 after Gate 0 host/build identity is confirmed.
- Keep Life List and other private surfaces out of public sitemaps and indexable metadata.

### P0-E — Governance evidence
Owner/admin must restore and prove protection enforcement before any merge decision. Fresh read-only GitHub evidence at `2026-10-24T12:17:19Z` shows ruleset 24946178 has `enforcement: disabled`; `main` returns `protected: false` and `protection.enabled: false`. The ruleset is configured for one approval, latest-push approval, stale-review dismissal, resolved threads, strict `verify`, and non-fast-forward prevention, but these are dormant while enforcement is disabled. Branch deletion protection is separately **NOT VERIFIED**.

## Next tier, ordered only after Tier 0

1. Life List mutation durability and clear user-visible write failure (#341 is proposed; review current exact head, don't assume merged).
2. Map/list parity, cancellation, deterministic pagination and exact-count/sentinel semantics; preserve current server-owned locality scope.
3. WorkOpportunity source, publication, freshness, rights and human attestation contract.
4. AI draft quota, concurrent request tests, cost limits and kill switch in a disposable environment; public grounded AI remains OFF.
5. Accessibility/mobile/date-line QA, four-language correctness and consent/privacy review.
6. Live Map specification and global geographic discovery architecture are design artifacts only until security/identity gates pass.
7. Non-production worker rehearsal, then outcome-led one-locality pilot after owner/legal/safety authorization.

## Merge queue policy

Current GitHub snapshot at `2026-10-24T12:25:32Z`: **98 open PRs (93 drafts, 5 non-drafts)**. The default branch remains `182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f`. Ruleset `24946178` currently has `enforcement: disabled`; `main` is returned as `protected: false`. Before merge planning, re-check base/head SHAs, changed paths, review/thread state, exact checks, and restore/verify governance controls. Consolidate only after preserving unique fixes. No automated merge.
