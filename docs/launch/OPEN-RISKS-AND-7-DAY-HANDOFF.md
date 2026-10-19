# Open Risks & Founder 7-Day Handoff

**Snapshot:** 19 October 2026; current main `0c56cc299825dea5996323506e7a1cc9266975c8`.
**Purpose:** decision log for founder, engineering, trust/safety, data and growth owners.

## Current repository facts

- #157 (tracked environment-file hygiene), #163 (explicit service-area requirement), #170 (deployment-configurable default locality) and #129 (private crawler paths/sitemap policy) are merged on current main.
- #154 (exact open-need counts and fail-closed place scope) and #169 (strict need input schema and canonical place normalization) remain open against an older base.
- Draft integration PR #172 applies both behavioural changes onto current main `0c56cc2…`. Its fresh hosted Verify was observed starting; no pass claim until completion and independent review.
- Draft documentation PR #171 exists; this document and related launch notes are intended to extend that branch.
- `AGENTS.md` requires independent review and prohibits autonomous merge, force-push and deploy.
- Conversation security #162 is not a beta claim until disposable-database evidence passes.
- Australia is not live; no Australian data is loaded by this plan.

## P0 unresolved risks

1. **Integration verification:** #172 requires fresh install/lint/test/build and a human review of the combined diff, especially `needs.functions.ts` and home/locality loading/error/unknown count states.
2. **Private-data isolation:** production database RLS and per-user access need independent disposable-database testing. Do not infer success from client code or skipped hosted database previews.
3. **Conversation security:** excluded from claims until #162 proof; avoid directing the investor demo through private messaging as a security feature.
4. **Real supply and operations:** verify live data counts in the actual pilot environment; recruit real publishers/hosts and assign moderation/support ownership.
5. **Geo/default locality:** ensure residence never confers service area; check current configured defaults and that absent market data never implies coverage.
6. **SEO runtime parity:** code has static and dynamic robots/sitemap paths, but actual deployed content, origin, HTTP status, canonical links and robots output must be checked after the intended deployment. Do not claim a fix is live solely because files merged.
7. **API boundary:** no stable, versioned public REST contract was identified in this static inventory; future external partners need explicit contracts and per-export authorization review.
8. **Data rights and market law:** source licences, attribution, refresh/deletion, work/volunteering terms, privacy and support must be market-cleared before the market is enabled.
9. **Product naming:** README/site uses Real World Atlas, Living World and Life Lived Network in different places; founder must choose one name and a transition/SEO plan.
10. **Security hygiene:** PR #157 removed the tracked root `.env` in the merged tree according to the PR. This does not prove historical blobs were scrubbed or secrets never leaked; history scan and credential action require separate reviewed evidence, not an automatic rewrite/rotation.

## Founder action list — next 7 days

### Day 1 — lock source and merge path
- Review PR #172's current-main conflict resolution and exact diff; ensure its Verify run has passed; request/record an independent approval.
- After #172 passes review, decide whether to close/supersede #154 and #169. Do not merge either stale branch as-is.
- Confirm one canonical public product name and domain.
- Name accountable owners for engineering, data licensing, moderation/support and legal review.

### Day 2 — beta boundary and security
- Define the pilot locality and invite-only audience.
- Run a disposable-database access matrix using anonymous, User A and User B for profile, need, listing, conversation, saved item, block and report objects. Record actual RLS behavior; keep #162 excluded until its own proof is approved.
- Verify owner/service-area separation and private-data no-flash behavior.

### Day 3 — supply and trust operations
- Onboard a first set of real supply providers directly; get permission and terms for each listing.
- Check freshness, owner authenticity, compensation/accommodation/duties and regional policy before publication.
- Exercise report/block/moderation flows with an assigned operator and escalation contact.

### Day 4 — release engineering
- Run clean install, lint, tests, production build, mobile/desktop browser walkthrough and SEO endpoint checks on the exact candidate build.
- Capture actual logs/check outputs and defects; fix P0s only, with regression tests.
- Write rollback/disable instructions and a support runbook.

### Day 5 — pilot rehearsal
- Use the sparse-data demo script; verify the UI handles quiet places, errors and missing provider credentials truthfully.
- Invite a small controlled cohort; confirm consent and support route.
- Measure first useful result, publisher response, completed activity reports and moderation load without invasive tracking.

### Day 6 — investor evidence
- Prepare architecture, verified test evidence, release gates, source-rights plan, current risks and pilot metrics definitions.
- Do not report active users, conversion, revenue, global coverage or partnerships unless independently evidenced.
- Ask Google engineers the questions in `INVESTOR-GOOGLE-ENGINEERING-BRIEF.md`.

### Day 7 — go/no-go
- Review incident rehearsal, known issues, support capacity and live supply freshness.
- Launch only within approved feature and geography bounds if all P0 gates pass; otherwise extend invite-only pilot and report specific blockers.

## Final release rule

A missed date is acceptable; a knowingly unsafe or misleading release is not. Do not solve sparse data with fabricated records, skip review to meet a deadline, or describe code as deployed without observing the deployed service.
