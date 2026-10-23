# Security and Release Gates

**Evidence snapshot:** 2026-10-23 22:08 UTC  
**Canonical source examined:** main at 182fe7f05c9efbee9ac17ccbca4d420cc0f1b24f  
**Status vocabulary:** VERIFIED_ON_MAIN, VERIFIED_LIVE, CANDIDATE, UNKNOWN, BLOCKED, NOT RUN. A source change is not proof of a deployed behavior.

## Gate board

| Gate | Status | Current evidence | Exact exit evidence |
|---|---|---|---|
| 0 — Authoritative identity | BLOCKED | Owner-reported Lovable project ID is b3293d2a-3218-4206-ab04-af8e984023ac, but configured Git repository/sync branch, canonical host + deployed build SHA, actual production Supabase project, and a separately disposable project are not authoritatively confirmed. Repository Supabase ref is csgngcnaqeoxyopvnzjo and cannot be assumed to identify the live backend. | Owner/admin records exact Lovable repository + protected non-main sync branch, canonical HTTPS hostname + deployed build SHA, live Supabase project ID, and a separate disposable project. Compare files and configuration before any sync. |
| 1 — Repository governance | PARTIAL / BLOCKED | Active ruleset 24946178 protects the default branch, requires one approval, dismisses stale approvals, requires approval after latest push, resolves review threads, and requires the strict verify check. The returned rules do not include deletion protection. The classic branch-protection GET returned 403 to the available integration. Repository metadata reports delete_branch_on_merge=false, which is not proof of branch deletion protection. | Admin verifies and records deletion protection, required reviews/checks, bypass actors and enforcement in Settings; re-fetch the raw ruleset after changes. No agent changes rules without explicit authorization. |
| 2 — Runtime identity | UNKNOWN | Main is TypeScript/TanStack Start/React. Repository evidence does not establish the runtime or services adjacent to the published host. | Owner confirms hosting/runtime and whether a separate PHP service exists. If one exists, inventory exact version and remediation evidence through the hosting owner. |
| 3 — PR convergence | BLOCKED | GitHub currently returns 93 open PRs: 86 drafts and 7 non-drafts. 15 have main as base with the current main SHA; 64 target main at an older base SHA; 14 are stacked on non-main branches. | Each candidate is classified against exact current main and current dependency heads, with overlap/review/check/thread evidence. No merge by automation; prefer consolidation or porting unique fixes over parallel duplicates. |
| 4 — Locality privacy / least privilege | FAIL AT MAIN SOURCE; candidate remediation only | Main does not contain the new verified membership-backed local_discovery policy. PR #348 proposes exact-place membership RLS + disposable pgTAP/PostgREST tests; #350, #352 and #354 are stacked follow-ons. They are not proof of merged or hosted policy. Issue #164 still requires the full ACL/default-privilege matrix. | Fresh local Supabase migration replay; pgTAP and loopback-only PostgREST allow/deny tests; anonymous, authenticated user A/B and child/parent locality matrix; direct table and RPC paths; effective grants/policies/function ownership/search_path inspected; independent security review. Hosted disposable proof only after Gate 0 identity is confirmed. |
| 5 — Published SEO / private-route parity | FAIL ON LAST OBSERVED PROBE; fresh GET NOT RUN | Workflow run 39948523188 recorded 19 failures, including sitemap.xml returning HTML 404, missing robots sitemap/private-path rules, and Life List noindex mismatch. Direct URLs were inaccessible to this session's browser tool, so this run did not freshly verify the host. This is parity evidence, not proof of saved-data leakage. | Confirm host/build (Gate 0), authorize republish, then GET robots.txt, sitemap index and every child sitemap, canonical metadata and /life-list head metadata on that exact host. Save status/headers/body snippets and compare with main's route/indexability policy. |
| 6 — Genuine 24/7 worker | BLOCKED | PR #336 proposes a bounded lease-fenced runtime core; it explicitly has no live provider adapter, scheduled executor, confirmed project, continuous heartbeat, or recovery/alert proof. Existing daily automation is not continuous 24/7 execution. | On an owner-confirmed disposable environment, prove authenticated worker identity, single-claim fencing, heartbeat expiry, idempotency, cancellation, bounded retry/time/cost, dead-letter/recovery, operator kill switch and alert delivery over an observed interval. Keep human approval for merge/deploy/production writes. |

## P0 and security acceptance checklist

- [ ] Gate 0 identity package is signed off by owner/admin.
- [ ] Exact locality policy and authenticated read path are independently reviewed as one end-to-end boundary, not as isolated migrations.
- [ ] Allow/deny matrix proves anonymous users cannot read local_discovery; a user cannot read another place; editable profile locality and query parameters do not grant authorization; membership evidence is not directly exposed.
- [ ] Existing public reads still work only for eligible, current public rows.
- [ ] The canonical matcher remains the sole matching authority; no service-role shortcut or anonymous fallback can widen scope.
- [ ] Issue #164 inventory covers table/column ACLs, RLS/policies, functions/RPC execution, storage, default ACLs for each object-creating role, and migrations/rollback.
- [ ] Live sitemap/robots/canonical/noindex behavior passes on the owner-confirmed deployed build.
- [ ] Branch deletion protection is explicitly proved.
- [ ] Required Verify, CodeQL, dependency audit and TypeScript checks pass on the exact final head; Supabase Preview skipped is NOT a pass.
- [ ] Keyboard, screen-reader, mobile and date-line QA is recorded by a person other than the author.

## Owner-only decisions

Canonical host/build/backend identity; Lovable Git target and sync branch; deletion protection/admin settings; any hosted database inspection or mutation; authorized republish/deployment; security exceptions; provider selection/retention/spend; public AI activation; external outreach and launch decisions.

No public page generation, sitemap expansion, public AI, hosted writes, merge or deployment is authorized by this document.
