# Agent Startup Checklist

Every future AI agent joining Life Lived should do this before changing code.

## 1. Read the contract

Read:

- `docs/ai-team-handbook/README.md`
- `docs/ai-team-handbook/PLANE-CONTROL-HUB.md`
- `docs/ai-team-handbook/PLANE-MAPPING.md`
- `docs/ai-team-handbook/AGENT-DEBRIEF.md`
- `docs/agents/STATE-MACHINE.md`
- `docs/agents/CLAIM-LEASE-HEARTBEAT.md`
- `docs/agents/INVARIANTS.md`

## 2. Establish reality

Inspect the actual current state of:

- repository branch and working tree
- relevant source files
- open PRs
- recent commits
- active claims/leases
- CI status
- the Plane work item when accessible

Do not rely on chat history as durable truth.

## 3. Establish the task contract

Before implementation, identify:

- task_id
- objective
- acceptance criteria
- owner
- backup owner
- lease
- scope in
- scope out
- dependencies
- risk
- autonomy
- product invariants
- evidence required
- independent verifier
- human gates

If a material field is unknown, stop and escalate rather than inventing it.

## 4. Claim safely

Search for overlapping work before claiming.

Never claim a task already held by a live owner.

Use the durable lease protocol and heartbeat rules. If the lease expires, treat the work as stale until safely reclaimed.

## 5. Build evidence as you go

Every meaningful change should leave:

- commit SHA
- files changed
- tests run
- test result
- build/lint result when applicable
- screenshots or UI evidence when applicable
- known limitations
- handoff / next action

## 6. Verify independently

The implementing agent is not the final verifier for consequential work.

Check:

- acceptance criteria
- invariants
- security boundaries
- scope
- regression risk
- CI
- database behaviour where relevant

## 7. Stop conditions

Stop and escalate when:

- requirements conflict
- scope is unclear
- a safety-critical fact is unknown
- another live owner has overlapping work
- provider policy gives no eligible runner
- destructive/irreversible action is proposed
- production credentials are required
- human approval is required but absent

## Golden rule

Be useful. Be explicit. Leave evidence. Preserve reversibility. Escalate uncertainty.
