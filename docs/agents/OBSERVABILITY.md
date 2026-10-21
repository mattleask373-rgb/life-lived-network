# Observability & Metrics

A future human (or agent) must be able to answer “What happened overnight?” from durable records.

## Status questions
- CURRENT QUEUE — what work exists?
- ACTIVE — who owns what (lease + heartbeat)?
- BLOCKED — what is stopping progress?
- STALE — what has stopped responding?
- FAILURES — recent CI / test / invariant failures?
- VERIFIED — independently checked?
- RELEASE — ready for human merge?
- NEXT — safest highest-value unblocked task?

## Metrics to record (do not optimise directly)
- tasks discovered / completed per day
- cycle time (READY → INTEGRATED)
- stale task rate
- blocked rate + mean blocked duration
- duplicate-work incidents
- review rejection / change-request rate
- regression rate
- mean recovery time
- invariant failure count
- security findings
- provider failures
- fixture-leakage detections
- merge-ready rate
- human intervention rate
- complete-handoff percentage

Higher commit count is not success. Lower regression + higher validated product value per unit of human attention is success.

Status may be maintained in:
- `docs/agents/STATUS.md` (lightweight, human-readable)
- GitHub Issues with labels
- Future automation under explicit policy

## Scheduled repository-contract probe (not an agent executor)

`.github/workflows/agent-control-plane-probe.yml` defines a read-only GitHub Actions probe on an hourly schedule (minute 17) plus manual dispatch. Once merged to the default branch and observed running, each successful run records a UTC heartbeat, revision, ref and workflow-run URL in the Actions job summary. It checks only that the canonical lifecycle, claim/lease, invariants, observability and ADR documents exist and that mandatory guardrails remain present.

**Permissions and side effects:** `contents: read`; checkout disables persisted credentials; no Supabase/API credentials are supplied; no database or external provider is contacted; no model is called; no task is claimed or dispatched; no repository, production, user or task state is mutated by the probe.

**Interpretation:** a green probe means the repository probe ran and its documentation checks passed at the reported revision. It does *not* mean an agent is alive, a queue is being processed, leases/heartbeats are persisted, control-plane migrations are installed, or production is healthy. Do not label it “24/7 AI agent active.”

GitHub scheduled workflows run only from the default branch and can be delayed or dropped under load. Use this as a low-cost observability signal, not a minute-critical scheduler. A real executor remains blocked on control-plane reconciliation (#116), hosted non-production adversarial proof (#117), an approved provider adapter (#118), truthful operator telemetry (#119), and authoritative scope boundary (#115). See [GitHub's schedule event documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).

This probe does not satisfy issue #121's acceptance criterion for an end-to-end provider-neutral agent task; it is a safe reliability slice only.
