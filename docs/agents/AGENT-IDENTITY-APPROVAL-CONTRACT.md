# Agent Identity & Approval Contract

This is a pure provider-neutral validation seam for the durable agent control
plane. It does **not** authenticate callers. The server/persistence boundary
must bind these values to a verified identity before accepting an action.

## Identity

Every action is scoped to:

- actor ID
- agent ID
- execution/run ID
- workspace ID
- project ID
- task ID

This prevents a durable control plane from treating a free-form owner string
as proof of authority.

## Approval

Human approval is:

- uniquely identified;
- scoped to workspace, project, task and action;
- issued by an actor different from the executing agent;
- time-bounded;
- explicit.

Approval is required for:

- P0/P1 actions;
- irreversible actions;
- explicitly human-gated actions;
- external side effects;
- merge;
- deploy.

Merge/deploy remain outside autonomous authority even when a valid approval
object exists; the production boundary must enforce its own policy.

## Important security property

Validation here is **not authentication**. A string such as \`human:1\` is not
evidence that a human actually authenticated. The durable server boundary must
resolve the actor from its authenticated session/service identity and compare
it with this contract.

## Scope

This contract introduces no database schema, RLS policy, provider, executor,
matcher, ranker, recommendation engine, learner model, or production mutation.
It is designed to become an input contract for #74 and the existing #61/#62/#64
control-plane work.
