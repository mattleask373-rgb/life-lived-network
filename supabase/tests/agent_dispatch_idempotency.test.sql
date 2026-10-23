BEGIN;
SELECT plan(5);

-- Integration contract for the server-only dispatch RPC. The enclosing
-- transaction rolls back all synthetic control-plane records.
INSERT INTO public.agent_events (
  event_id, delivery_id, webhook_id, event_type, entity_id, workspace_id, raw_payload
)
VALUES
  ('audit-dispatch-event-1', 'audit-delivery-1', 'audit-hook-1', 'test.dispatch', 'test-entity-1', 'audit-workspace', '{}'::jsonb),
  ('audit-dispatch-event-2', 'audit-delivery-2', 'audit-hook-2', 'test.dispatch', 'test-entity-2', 'audit-workspace', '{}'::jsonb);

INSERT INTO public.agent_tasks (
  task_id, event_id, workspace_id, work_item_id, objective, lane, autonomy, risk,
  status, provider, envelope, project_id
)
VALUES
  ('audit-dispatch-task-1', 'audit-dispatch-event-1', 'audit-workspace', 'audit-item-1', 'test dispatch retry', 'test', 'L1', 'P2', 'READY', 'auto', '{}'::jsonb, 'audit-project'),
  ('audit-dispatch-task-2', 'audit-dispatch-event-2', 'audit-workspace', 'audit-item-2', 'test correlation collision', 'test', 'L1', 'P2', 'READY', 'auto', '{}'::jsonb, 'audit-project');

INSERT INTO public.agent_execution_runs (
  run_id, actor_id, workspace_id, requested_label, status, project_id
)
VALUES
  ('00000000-0000-4000-8000-00000000d101', 'audit-worker', 'audit-workspace', 'idempotency-a', 'ACTIVE', 'audit-project'),
  ('00000000-0000-4000-8000-00000000d102', 'audit-worker', 'audit-workspace', 'idempotency-b', 'ACTIVE', 'audit-project');

CREATE TEMP TABLE dispatch_probe (
  attempt_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  run_id UUID NOT NULL,
  project_id TEXT,
  lease_generation BIGINT,
  lease_token TEXT,
  correlation_id TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO dispatch_probe
SELECT attempt_id, task_id, run_id, project_id, lease_generation, lease_token, correlation_id
FROM public.dispatch_agent_attempt(
  'audit-dispatch-task-1',
  '00000000-0000-4000-8000-00000000d101',
  'audit-worker',
  'audit-workspace',
  'audit-project',
  'test-provider',
  'audit-correlation-idempotent'
);

SELECT ok(
  (SELECT count(*) = 1 AND min(attempt_id) IS NOT NULL FROM dispatch_probe)
  AND (SELECT status = 'CLAIMED' AND lease_token IS NOT NULL AND lease_expiry > now()
       FROM public.agent_tasks WHERE task_id = 'audit-dispatch-task-1'),
  'first dispatch creates one attempt and a live fenced task lease'
);

-- A retry with identical scope after the task left READY must return the exact
-- same attempt/lease, without creating a second attempt or audit event.
INSERT INTO dispatch_probe
SELECT attempt_id, task_id, run_id, project_id, lease_generation, lease_token, correlation_id
FROM public.dispatch_agent_attempt(
  'audit-dispatch-task-1',
  '00000000-0000-4000-8000-00000000d101',
  'audit-worker',
  'audit-workspace',
  'audit-project',
  'test-provider',
  'audit-correlation-idempotent'
);

SELECT ok(
  (SELECT count(DISTINCT attempt_id) = 1 AND count(*) = 2 FROM dispatch_probe)
  AND (SELECT count(*) = 1 FROM public.agent_execution_attempts
       WHERE correlation_id = 'audit-correlation-idempotent')
  AND (SELECT count(*) = 1 FROM public.agent_execution_audit
       WHERE evidence ->> 'correlation_id' = 'audit-correlation-idempotent'),
  'an exact retry reuses the same live attempt without duplicate side effects'
);

SELECT throws_ok(
  $$ SELECT * FROM public.dispatch_agent_attempt(
    'audit-dispatch-task-2',
    '00000000-0000-4000-8000-00000000d102',
    'audit-worker',
    'audit-workspace',
    'audit-project',
    'test-provider',
    'audit-correlation-idempotent'
  ) $$,
  'P0001',
  'correlation ID already bound to a different dispatch scope',
  'a correlation collision across tasks/runs is rejected rather than returning another lease'
);

SELECT is(
  (SELECT count(*) FROM public.agent_execution_attempts
   WHERE correlation_id = 'audit-correlation-idempotent'),
  1::bigint,
  'a conflicting retry cannot create a second attempt'
);

SELECT ok(
  (SELECT lease_generation = 1 AND lease_token = (SELECT lease_token FROM dispatch_probe LIMIT 1)
   FROM public.agent_tasks WHERE task_id = 'audit-dispatch-task-1'),
  'an exact retry does not rotate the lease generation or token'
);

SELECT * FROM finish();
ROLLBACK;
