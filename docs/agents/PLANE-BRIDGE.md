# Plane Bridge — Implementation Contract

## Goal

Connect Plane to the repository-resident control plane without making Plane AI credits a hard dependency.

Plane supports workspace-level webhooks, REST API v2 and an MCP server. Webhooks are the preferred trigger because they push changes immediately rather than requiring polling.

## Required components

Plane
  |
  | HTTPS webhook
  v
plane-webhook-receiver
  |
  +--> signature verification
  +--> event idempotency
  +--> task normalisation
  +--> queue
          |
          +--> runner adapter
          |      +--> Plane Agent
          |      +--> external coding agent
          |      +--> human/manual
          |
          +--> result writer
                 |
                 +--> Plane state/comment
                 +--> GitHub branch/PR

## Webhook requirements

The receiver must:

- accept only HTTPS
- read the raw request body
- verify X-Plane-Signature using HMAC-SHA256
- use event_id for idempotency
- return 2xx only after the event is durably recorded
- never execute model work inline with the webhook request
- expose health/queue metrics without exposing secrets

Plane retries failed deliveries with exponential backoff and can disable a webhook after repeated failures, so the endpoint should be fast and durable.

## Event routing

Recommended first trigger:

workitem.updated where the work item moves into a configured agent-ready state.

Do not trigger on every update initially. A narrow trigger prevents loops where the agent updates the same work item and immediately retriggers itself.

Recommended state/label contract:

- agent-ready: eligible for orchestration
- agent-claimed: durable claim exists
- agent-verifying: implementation complete
- agent-review: independent review required
- agent-blocked: explicit blocker
- agent-human: human decision required

Use Plane state groups for coarse lifecycle and labels/custom metadata for orchestration details. Exact IDs must be configured per workspace, not hard-coded into application code.

## Feedback loop protection

Every write made by the orchestrator should carry a correlation value:

agent-run:<task_id>:<attempt>

The bridge must ignore its own bookkeeping updates unless they represent a meaningful lifecycle transition.

## Initial implementation scope

Phase A:
1. Plane v2 webhook receiver
2. HMAC verification
3. idempotency store
4. normalized task envelope
5. dry-run dispatcher
6. structured result/handoff format

Phase B:
1. external runner adapter
2. GitHub branch/PR adapter
3. Plane result writer
4. independent review dispatch

Phase C:
1. provider health/routing
2. stale-claim recovery
3. scheduled queue reconciliation
4. cost/latency metrics

## Security

Never store Plane API keys, webhook secrets, GitHub tokens or model API keys in repository files, task descriptions, comments or handoffs.

Use deployment secrets/environment variables only.

## Why this solves the credit problem

Plane AI remains useful as one runner, but if its monthly Agent credits are exhausted, the work item routes to another eligible runner or waits in READY/BLOCKED. The lifecycle, evidence, claims and human gates continue unchanged.

Plane's current billing model separates individual AI usage from shared Agent credits; self-hosted Plane can also use customer-owned model keys.
