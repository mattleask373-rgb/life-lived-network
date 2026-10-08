# Phase 6 — Human attention priority queue

**Status: IMPLEMENTED / NOT LIVE**

## Purpose

When the control plane HOLDs, rejects a fence, finds insufficient evidence, or hits a production boundary, humans need a **priority-ordered** queue — not a flat log.

## Adds

- `buildAttentionQueue(signals)` — pure mapping from control-plane signals → ordered `HumanAttentionItem[]`
- `gateWorkType(workType)` — CONTINUE_OFFLINE_SAFE | QUEUE_FOR_HUMAN | UNKNOWN_HOLD (fail-closed)
- Priority: security → production → approval → high risk → conflict → evidence → ambiguity → decision

## Explicit non-goals

- Does not consume human approvals
- Does not write durable rows
- Does not merge, deploy, or mint credentials
- Does not activate a live executor
- Does not replace ChatGPT Phases 9–11 (evidence / durable fence / idempotency)

## Integration points (future, still NOT LIVE)

- Supervisor HOLD (human-gated risk) → `HUMAN_GATED_RISK` signal
- Attempt fence reject → `FENCE_REJECT` signal
- Phase 9 evidence kernel fail → `EVIDENCE_INSUFFICIENT` signal
- Any production_deployment / destructive_migration proposal → `PRODUCTION_BOUNDARY`

## Related

#97, #98, #104, #106, #108; Grok pure fencing; ChatGPT durable result RPC.
