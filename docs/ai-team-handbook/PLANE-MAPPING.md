# Plane → Control Plane Mapping

This is the machine-facing contract for turning Plane work into executable agent work.

## Source-of-truth rule

Plane tells us what work is wanted. The control plane makes it executable. GitHub proves what changed. Tests/CI provide verification evidence. Humans approve consequential changes.

## Required mapping

| Plane input | Control-plane field | Rule |
|---|---|---|
| Project/work item identity | `work_item_id` + derived `task_id` | Must be stable and unique |
| Objective/title | `objective` | Preserve intent; never invent scope |
| Description | task context | Normalize, do not silently rewrite |
| Acceptance criteria | `acceptance_criteria` | Required for execution |
| Priority | scheduling metadata | Does not override safety gates |
| Risk | `risk` / `risk_level` | Unknown risk escalates |
| Autonomy | `autonomy` | Policy input, not permission to bypass gates |
| Scope in/out | `scope_in` / `scope_out` | Agent must stay inside scope |
| Dependencies | `dependencies` | Unmet dependencies block execution |
| Owner | `owner` | Human/agent owner, never assumed |
| Backup owner | `backup_owner` | Required for active autonomous work |
| Agent-ready signal | normalized readiness | Only explicit readiness enters READY |
| Human gate | `human_gate_required` | Cannot be removed by an agent |
| Labels/custom fields | normalized metadata | Never the sole source of a safety-critical fact |

## Lifecycle

Canonical lifecycle:

`READY → CLAIMED → IN_PROGRESS → VERIFYING → REVIEW → ACCEPTED`

Exception states:

`BLOCKED, STALE, CHANGES_REQUESTED, ABANDONED, CANCELLED`

Rules:

- State transitions must be durable and guarded.
- A status is not evidence of success.
- `ACCEPTED` requires independent verification plus any required human approval.
- `STALE` preserves branch, commits, evidence and handoff.
- Reclaim requires a fresh lease; never silently overwrite live ownership.

## Provider routing

Plane must not name a model as the required execution provider unless policy explicitly requires it.

The provider registry decides eligibility from:

- task risk
- autonomy level
- capability
- provider availability
- execution enabled/disabled
- required human gate
- provider outage state

If no provider is eligible, the task remains durable and visible; it does not disappear.

## Write-back policy

Phase 1: observe/read/normalize only.

Later safe writes may include:

- progress
- blocker
- handoff
- evidence links

High-risk writes remain human-gated:

- scope expansion
- security/privacy changes
- destructive migrations
- production credentials
- regulated behaviour
- irreversible actions
- main-branch merge

## Unknown handling

Unknown is a valid state.

Never convert:

- possible → confirmed
- suggested → approved
- claimed → verified
- generated → real-world fact

## Implementation target

`POST /api/agents/plane-webhook` should eventually produce the same durable task contract whether the execution provider is Grok, ChatGPT/OpenAI, Plane AI, another specialist, or a human.

No provider invocation belongs in ingress.
