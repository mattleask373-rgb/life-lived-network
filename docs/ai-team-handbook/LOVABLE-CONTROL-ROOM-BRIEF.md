# Lovable Control Room Brief

## Purpose

Build the human-facing Agent Operations control room for Life Lived / Real World Atlas.

This is a UI/control-surface project. It must not become a second source of truth.

## Trust boundary

- Plane = requested work / operational command surface
- Agent control plane = executable task state
- GitHub = implementation truth
- CI/tests = verification evidence
- Human = final authority for consequential changes

## Required UI

Show the canonical lifecycle:

`READY → CLAIMED → IN_PROGRESS → VERIFYING → REVIEW → ACCEPTED → INTEGRATED`

Exception states:

`BLOCKED, STALE, CHANGES_REQUESTED, ABANDONED, CANCELLED`

Every task view should make these visible:

- task id
- objective
- owner
- backup owner
- provider
- risk
- autonomy
- lease expiry / heartbeat health
- current status
- acceptance criteria
- scope in/out
- dependencies

## Evidence boundary

Separate:

1. Agent-reported evidence
2. Independent verification
3. Human approval

Never render an agent claim as verified merely because a task status says ACCEPTED.

## Human gates

Make the following visibly approval-gated:

- main-branch merge
- architecture changes
- security/privacy changes
- destructive migrations
- production secrets
- regulated behaviour
- irreversible actions

## Provider surface

Display policy/configuration for:

- Grok
- ChatGPT/OpenAI
- Plane AI
- Human

Show capability, risk eligibility, availability, and whether execution is enabled.

Do not imply live provider connectivity unless a real data source proves it.

## Operational health

Provide empty/realistic typed states for:

- active tasks
- stale tasks
- blocked tasks
- queue depth
- review failures
- human interventions
- provider availability

If no live source exists, use an explicit `DEMO DATA` / `NOT CONNECTED` treatment. Never invent successful events or live counts.

## Audit timeline

Visualize:

received → normalized → claimed → work → evidence → review → human gate → PR → CI → merge

## Recovery UX

A stale → reclaim flow may be demonstrated, but it must be clearly labelled simulated/demo and must not mutate production data.

## Design

Preserve the Real World Atlas hand-drawn, warm, human visual language. This should feel like a calm operations desk rather than a generic SaaS admin dashboard.

Responsive, keyboard accessible, clear loading/error/empty states.

## Safety

Do not:

- invoke providers
- add production credentials
- enable production Plane webhooks
- alter product matching/discovery truth
- create destructive migrations
- auto-merge main
- fabricate live operational state

## Current backend evidence

The agent control-plane PR has a green Verify run on the latest head: lint PASS, 265/265 tests PASS, build PASS.

Live Supabase RPC concurrency and deployed SECURITY DEFINER grants remain NOT VERIFIED.

## Handoff

When implementing this brief, report:

- exact files changed
- commit SHA
- checks run/results
- what is demo vs live
- known limitations
- next action

Never claim the control room is connected to live agent infrastructure until that connection is actually verified.
