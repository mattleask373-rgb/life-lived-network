# Founder Quick Start — Next 24 Hours
**Last verified:** 2026-10-19 09:34 Europe/London (fresh GitHub repository, PR and ruleset read; no live runtime test).  
**Verified main HEAD:** 5f06fc336a748cf37c6a06ac272bee4a387bd745  
**Working branch at audit start:** cc33635d5bb6698e8825c80e30ad6495c9dc8d58 (7 commits ahead, 0 behind main at audit time).  
**Coordination:** [Issue #125](https://github.com/mattleask373-rgb/life-lived-network/issues/125)

This is the founder's shortest path through the current gates. It does not authorise deployment, production writes, database changes, data imports, or merges without the required human review.

## Do these first

### 1. Fix the required status-check names — keep the protections
Open **Settings → Rules → Rulesets → living World - protect main** and inspect the active ruleset targeting the default branch.

The fresh ruleset read showed these required contexts:
- **.github/workflows/verify.yml,** — appears malformed (trailing comma in the context string).
- **Verify** — no matching check name was observed on the five current PR heads.
- **verify** — observed as a successful GitHub Actions check.

Keep **verify** required if it remains the actual emitted check. Remove a stale context only after confirming it is not emitted by any required workflow. Preserve the one-approval requirement, last-push approval, resolved-review-thread rule, strict status checks, and branch deletion / force-push protections. Save, re-open the ruleset, and confirm the saved state. A successful save toast alone is not verification.

### 2. Obtain formal independent approvals for the five critical PRs
Current PRs: [#157](https://github.com/mattleask373-rgb/life-lived-network/pull/157), [#163](https://github.com/mattleask373-rgb/life-lived-network/pull/163), [#170](https://github.com/mattleask373-rgb/life-lived-network/pull/170), [#154](https://github.com/mattleask373-rgb/life-lived-network/pull/154), [#169](https://github.com/mattleask373-rgb/life-lived-network/pull/169).

All five remained open against the verified main SHA and GitHub reported mergeable_state=blocked. The review records visible in the fresh audit were **COMMENTED**, not formal **APPROVED** reviews. A recommendation comment is not an approval.

Ask an authorised reviewer other than the latest pusher to submit a formal **Approve** review. Confirm latest-head checks are green and review threads are resolved. The active ruleset requires approval of the last push, so verify that requirement is satisfied too. Do not weaken review rules to get a merge through.

### 3. Merge one at a time, then verify the new main
Use the existing proposed order only if the latest diff, dependencies, approvals and exact-head checks still support it:

1. #157 — remove tracked .env; inspect secret history separately without printing secret values.
2. #163 — residence alone must not imply service coverage.
3. #170 — configurable default locality.
4. #154 — exact open-need counts and fail-closed locality scope.
5. #169 — validated need payloads and canonical place lookup.

After each human-authorised merge, follow [PHASE-6-POST-MERGE-CHECKLIST.md](PHASE-6-POST-MERGE-CHECKLIST.md). Re-fetch main and run the safe project checks before moving to the next PR. If a check fails, stop the sequence and record the failure; do not press on based on an older green run.

### 4. Keep these gates closed
- **#162 conversation security:** not database-proven. Do not run its historical integration harness against hosted/shared/production databases. The safe rewrite plan must require opt-in, a positively identified disposable database, and fixture-scoped cleanup.
- **Australia:** out of scope. Live database place coverage remains unknown; do not import or invent place records.
- **Production SEO:** repository changes are not a live fix. The published origin and authorised publish path require a separate human-controlled check.
- **Deployment / Lovable sync:** no deployment or sync is authorised by this checklist.

## What success looks like on Friday — 23 October 2026
A defensible outcome is:
- The five critical PRs have either been merged by authorised humans after formal approval, or each remaining blocker is explicitly recorded.
- The resulting main SHA is captured, and exact-main install, lint, test and build checks pass (or failures are documented as a no-go).
- Discovery, service-area matching, locality defaults, open-need counts and need creation have been rechecked against the merged code.
- The beta is limited to localities with real, supported place data.
- Conversation isolation is explicitly described as **not database-proven** unless safe multi-account disposable-DB tests actually run and pass.
- Australia remains excluded unless a separate approved data-readiness gate closes.
- No unsupported claims are made about traction, partnerships, deployment, SEO, or an autonomous executor.

A missed Friday target is preferable to reporting a green release without evidence.

## Commands for the post-merge check
Run from a clean local checkout after an authorised merge. If Git refuses to switch branches because local changes exist, stop and preserve those changes; do not use a destructive reset or blind stash.

    git fetch origin
    git switch main
    git pull --ff-only origin main
    git rev-parse HEAD
    git status --short
    bun --version
    bun install --frozen-lockfile
    bun run lint
    bun run test
    bun run build

Expected: local HEAD equals the just-verified GitHub main SHA; working tree is clean before checks; every command exits 0. Record each exit code and the SHA. These commands have not been run as part of this documentation update.

## Coordination
Post the current SHA, exact test evidence, formal review state and remaining human decisions to [Issue #125](https://github.com/mattleask373-rgb/life-lived-network/issues/125). Do not state “ready” solely because mergeable=true or a previous Verify run was green.
