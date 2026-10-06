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
