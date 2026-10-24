# Current Priorities — Evidence-Gated Execution

**Snapshot:** 2026-10-23 22:15 UTC  
**Current main:** 182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f  
**Operating mode:** security-first, no public surface expansion while Gates 0 and 4 remain open.

## Highest-priority dependency order

### P0-A — Confirm authoritative environment identity (owner/admin)
Required: exact Lovable Git target + protected non-main sync branch; canonical host and deployed build SHA; production Supabase project ID; separate disposable Supabase project. Until verified, do not sync Lovable, change hosted settings, inspect/write private production rows, run load tests, or republish.

### P0-B — Close the local_discovery boundary in code and disposable evidence
Keep the existing candidate chain together, review each exact head and run all local tests:
1. [#348 — verified locality boundary](https://github.com/mattleask373-rgb/life-lived-network/pull/348), base main; migration/RLS, local pgTAP and loopback PostgREST matrix.
2. [#350 — scoped personal facts](https://github.com/mattleask373-rgb/life-lived-network/pull/350), stacked on #348.
3. [#352 — authenticated local reads](https://github.com/mattleask373-rgb/life-lived-network/pull/352), stacked on #350; observed exact-head Verify success on a38a755dc6dc669d7464f843db1aebe1ebb787c0 (run 40027771134).
4. [#354 — audited membership provisioning](https://github.com/mattleask373-rgb/life-lived-network/pull/354), stacked on #352. The initial head 68c1c51f failed lint due formatting; formatting was fixed in commits 7f79bb8c and 016c9237. Exact-head Verify run 40031616249 was in progress at the snapshot and is NOT a pass.
5. Independent security review of combined RLS policies, SECURITY DEFINER functions, service-role boundary, membership lifecycle and list → detail → supply path. No approval before evidence is complete.

Do not merge a partial slice that makes local_discovery disappear into an unexplained empty state or reopens an anonymous read fallback. Preserve truthful distinction between no eligible rows and a failed/unauthorized read.

### P0-C — Dependency gate and exact-head verification
- [#353 — Zod 4.6.7 advisory remediation](https://github.com/mattleask373-rgb/life-lived-network/pull/353), head 625600bd525965f180b3f76a499d8262b78e5e43: observed Verify and CodeQL success (runs 40027439338 and 40027439326). It overlaps the dependency bump present in #348; reconcile the change rather than merging duplicate lockfile edits.
- [#351 — fail closed on incomplete row reads](https://github.com/mattleask373-rgb/life-lived-network/pull/351): inherited dependency audit failed before app tests on its observed head. Rerun only after the dependency change is integrated or the branch is deliberately reconciled.
- Never treat cancelled/old-head checks as current green status.

### P0-D — SEO parity and public/private route policy
- [#335 — sitemap completeness and live verification](https://github.com/mattleask373-rgb/life-lived-network/pull/335), current base main, head 2ce6e030162f04592c734054cba1b1d06706e04d. Last exact Verify failed at dependency audit before its application tests; CodeQL/TypeScript passed on the recorded head. It remains proposed.
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

Current GitHub snapshot at 22:15 UTC: 94 open PRs (88 drafts, 6 non-drafts); 16 target main at current main SHA, 64 target main at an older base, and 14 target non-main branches. Freeze new feature branches while this queue is converged. Refresh base/head, changed paths, reviews, threads, mergeability, and exact-head checks before each decision. Close or consolidate only after preserving unique fixes. No automated merge.
