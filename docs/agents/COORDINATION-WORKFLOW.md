# Agent coordination workflow

This repository is the shared work record for authorised AI and human contributors. The workflow is designed to reduce human message-relaying without granting agents production authority.

## Sources of truth

- **Discussions:** coordination, proposals, questions, decisions, status and handoffs.
- **Issues:** actionable tasks, ownership, acceptance criteria, dependencies and blockers.
- **Pull requests:** proposed code/docs changes, review feedback and exact-head CI evidence.
- **GitHub Actions:** test results for the commit actually tested.
- **Production dashboards:** authoritative for deployed configuration, RLS and live service state; repository code alone cannot prove those states.

If a preferred Discussions category is not configured, use General for coordination, Ideas for proposals and Announcements for approved major updates. Do not create a parallel issue when an existing Issue/PR already owns the work.

## Agent start protocol

1. Read the latest Master Status and relevant open Issues/PRs.
2. Search for duplicate or overlapping work.
3. Claim one bounded task in its Issue or coordination thread. State the expected deliverable and dependencies.
4. Work only within the task's granted permissions. Prefer reversible branch-only changes and draft PRs.
5. Keep `findSupply()` in `src/lib/supply-engine.ts` as the sole discovery/matching authority.
6. Never treat memories as current presence, availability or a service area; do not fabricate users, supply, activity, testimonials, traffic, rankings, revenue or validation.
7. Do not expose credentials in source, logs, Issues, PRs or discussions.

## Handoff contract

Every meaningful handoff must include:

- **Role / agent**
- **Issue / PR**
- **Status:** NOT STARTED / IN PROGRESS / BLOCKED / REVIEW NEEDED / DONE
- **Evidence:** exact commit SHA, file path, CI run, test output or dashboard evidence
- **Next action**
- **Blocker / dependency / approval required**
- **Unverified claims:** explicitly marked UNKNOWN or HYPOTHESIS

A task is not DONE because code was written. State what was tested, what was not tested, whether CI tested the current head, and whether hosted/production behaviour remains unverified.

## Parallel work and escalation

- Agents may investigate, draft, test, review and propose within their existing access.
- When blocked, record the precise dependency and continue with independent reversible work.
- Before editing shared files, check current main and overlapping PRs. If branches have drifted, reconcile against the current base without rewriting published history.
- Use independent review for security-sensitive changes, production fixture boundaries, indexability/privacy, integrations and control-plane changes.
- CI green is necessary, not sufficient. Review correctness, scope, privacy and production implications separately.

## Human approval gates

No autonomous merge to main, force-push/history rewrite, production deployment, production data/schema/RLS/grant changes, credential/API-key changes, paid spend, contracts/terms, external outreach or major strategic pivots. Silence is not approval. A proposal or passing test does not grant production authority.

## Coordination cadence

Keep Master Status concise:
1. In progress — linked Issue/PR and owner role.
2. Ready for review — exact PR/head and CI state.
3. Blocked — specific blocker and needed decision.
4. Verified complete — evidence and remaining limits.
5. UNKNOWN — material facts that still need verification.

Prefer one focused thread per topic. Convert actionable decisions into Issues and link back to the discussion. Do not claim a message, category, pin, agent run or deployment exists unless there is direct evidence.
