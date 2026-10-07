# Fleet Sentinel

The Fleet Sentinel is the first always-on, read-only nervous-system seam for the multi-agent programme.

## Purpose

Every 15 minutes it observes the default branch and emits a small evidence packet containing:

- current main commit;
- open pull-request queue;
- recent failed Actions runs;
- manifest/lockfile consistency;
- explicit autonomous-executor readiness.

It does not execute product changes, claim tasks, merge pull requests, deploy, mutate issues, access secrets, or infer real-world facts.

## Why this exists

The 24/7 constitution needs a heartbeat before it needs autonomy. GitHub Actions supports scheduled workflows, including schedules as short as every five minutes; this sentinel deliberately uses a 15-minute cadence and an offset from the top of the hour to reduce schedule-load collisions. citeturn1search0turn1search2

The workflow uses read-only permissions. GitHub recommends granting `GITHUB_TOKEN` only the minimum permissions a workflow needs. citeturn2search0turn2search1

## Evidence boundary

The sentinel's executor status remains **MISSING** until the repository proves the complete durable chain:

`discover → prioritise → claim → execute → heartbeat → verify → evaluate → handoff → recover → learn → next task`

with authenticated actor/run identity, durable persistence, fencing, idempotency, bounded permissions and human integration gates.

## Next evolution

The sentinel is intentionally provider-neutral. Future bounded work can consume its pulse as an observation input for the existing control plane. It must not become a second matcher, ranker, discovery engine or hidden autonomous merge path.
