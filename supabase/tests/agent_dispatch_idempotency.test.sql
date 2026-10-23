BEGIN;
SELECT plan(9);

CREATE TEMP TABLE dispatch_test_context ON COMMIT DROP AS
SELECT
  ('dispatch-task-' || gen_random_uuid()::TEXT) AS task_id,
  ('dispatch-task-other-' || gen_random_uuid()::TEXT) AS other_task_id,
  ('dispatch-event-' || gen_random_uuid()::TEXT) AS event_id,
  ('dispatch-event-other-' || gen_random_uuid()::TEXT) AS other_event_id,
  gen_random_uuid() AS run_id,
  gen_random_uuid() AS other_run_id,
  ('dispatch-actor-' || gen_random_uuid()::TEXT) AS actor_id,
  ('dispatch-workspace-' || gen_random_uuid()::TEXT) AS workspace_id,
  ('dispatch-project-' || gen_random_uuid()::TEXT) AS project_id,
  ('dispatch-provider-' || gen_random_uuid()::TEXT) AS provider_id,
  ('dispatch-correlation-' || gen_random_uuid()::TEXT) AS correlation_id;

INSERT INTO public.agent_events (
  event_id, delivery_id, webhook_id, event_type, entity_id, workspace_id, raw_payload
)
SELECT
  event_id, event_id, 'worker-runtime-test', 'worker.dispatch.test',
  task_id, workspace_id, '{}'::JSONB
FROM dispatch_test_context
UNION ALL
SELECT
  other_event_id, other_event_id, 'worker-runtime-test', 'worker.dispatch.test',
  other_task_id, workspace_id, '{}'::JSONB
FROM dispatch_test_context;

INSERT INTO public.agent_tasks (
  task_id, event_id, workspace_id, project_id, work_item_id, objective,
  lane, autonomy, risk, status, provider, envelope
)
SELECT
  task_id, event_id, workspace_id, project_id, task_id,
  'Test idempotent dispatch', 'IMPLEMENTATION', 'L2', 'P2', 'READY',
  provider_id, '{}'::JSONB
FROM dispatch_test_context
UNION ALL
SELECT
  other_task_id, other_event_id, workspace_id, project_id, other_task_id,
  'Test correlation mismatch', 'IMPLEMENTATION', 'L2', 'P2', 'READY',
  provider_id, '{}'::JSONB
FROM dispatch_test_context;

INSERT INTO public.agent_execution_runs (run_id, actor_id, workspace_id, project_id, requested_label, status)
SELECT run_id, actor_id, workspace_id, project_id, 'dispatch idempotency test', 'ACTIVE'
FROM dispatch_test_context
UNION ALL
SELECT other_run_id, actor_id, workspace_id, project_id, 'dispatch idempotency test alternate run', 'ACTIVE'
FROM dispatch_test_context;

SELECT is(
  (
    SELECT dispatched.status
    FROM dispatch_test_context AS ctx,
    LATERAL public.dispatch_agent_attempt(
      ctx.task_id, ctx.run_id, ctx.actor_id, ctx.workspace_id,
      ctx.project_id, ctx.provider_id, ctx.correlation_id
    ) AS dispatched
  ),
  'DISPATCHED'::TEXT,
  'first invocation atomically dispatches one attempt'
);

SELECT is(
  (
    SELECT replay.status
    FROM dispatch_test_context AS ctx,
    LATERAL public.dispatch_agent_attempt(
      ctx.task_id, ctx.run_id, ctx.actor_id, ctx.workspace_id,
      ctx.project_id, ctx.provider_id, ctx.correlation_id
    ) AS replay
  ),
  'REPLAYED'::TEXT,
  'same idempotency key returns a non-executable replay marker'
);

SELECT ok(
  (
    SELECT replay.lease_token IS NULL
    FROM dispatch_test_context AS ctx,
    LATERAL public.dispatch_agent_attempt(
      ctx.task_id, ctx.run_id, ctx.actor_id, ctx.workspace_id,
      ctx.project_id, ctx.provider_id, ctx.correlation_id
    ) AS replay
  ),
  'a replay never returns an existing lease token'
);

SELECT throws_ok(
  (
    SELECT format(
      'SELECT * FROM public.dispatch_agent_attempt(%L, %L::UUID, %L, %L, %L, %L, %L)',
      ctx.other_task_id, ctx.run_id::TEXT, ctx.actor_id,
      ctx.workspace_id, ctx.project_id, ctx.provider_id, ctx.correlation_id
    )
    FROM dispatch_test_context AS ctx
  ),
  'P0001',
  'correlation ID reuse mismatch',
  'same correlation ID cannot be reused for another task'
);

SELECT throws_ok(
  (
    SELECT format(
      'SELECT * FROM public.dispatch_agent_attempt(%L, %L::UUID, %L, %L, %L, %L, %L)',
      ctx.task_id, ctx.run_id::TEXT, ctx.actor_id,
      ctx.workspace_id, ctx.project_id, 'provider-attacker', ctx.correlation_id
    )
    FROM dispatch_test_context AS ctx
  ),
  'P0001',
  'correlation ID reuse mismatch',
  'same correlation ID cannot be reused for another provider'
);

SELECT throws_ok(
  (
    SELECT format(
      'SELECT * FROM public.dispatch_agent_attempt(%L, %L::UUID, %L, %L, %L, %L, %L)',
      ctx.task_id, ctx.other_run_id::TEXT, ctx.actor_id,
      ctx.workspace_id, ctx.project_id, ctx.provider_id, ctx.correlation_id
    )
    FROM dispatch_test_context AS ctx
  ),
  'P0001',
  'correlation ID reuse mismatch',
  'same correlation ID cannot be reused across runs'
);

SELECT is(
  (SELECT COUNT(*)::INTEGER FROM public.agent_execution_attempts AS a, dispatch_test_context AS ctx
   WHERE a.correlation_id = ctx.correlation_id),
  1,
  'duplicate/rejected calls cannot create a second attempt'
);

SELECT is(
  (SELECT a.lease_generation FROM public.agent_execution_attempts AS a, dispatch_test_context AS ctx
   WHERE a.correlation_id = ctx.correlation_id),
  1::BIGINT,
  'retries cannot increment the generation or replace the original lease'
);

SELECT ok(
  (
    SELECT t.status = 'CLAIMED' AND t.lease_generation = 1
    FROM public.agent_tasks AS t, dispatch_test_context AS ctx
    WHERE t.task_id = ctx.task_id
  ),
  'replay leaves the original task claim unchanged'
);

SELECT * FROM finish();
ROLLBACK;
