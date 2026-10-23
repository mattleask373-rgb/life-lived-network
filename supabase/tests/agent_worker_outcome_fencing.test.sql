BEGIN;
SELECT plan(8);

INSERT INTO public.agent_events (
  event_id, delivery_id, webhook_id, event_type, entity_id, workspace_id, raw_payload
)
VALUES
  ('worker-outcome-event-1', 'worker-outcome-delivery-1', 'worker-outcome-hook-1', 'test.worker', 'worker-outcome-entity-1', 'worker-workspace', '{}'::jsonb),
  ('worker-outcome-event-2', 'worker-outcome-delivery-2', 'worker-outcome-hook-2', 'test.worker', 'worker-outcome-entity-2', 'worker-workspace', '{}'::jsonb);

INSERT INTO public.agent_tasks (
  task_id, event_id, workspace_id, work_item_id, objective, lane, autonomy, risk,
  status, provider, envelope, project_id
)
VALUES
  ('worker-outcome-task-1', 'worker-outcome-event-1', 'worker-workspace', 'worker-item-1', 'test review outcome', 'IMPLEMENTATION', 'L1', 'P2', 'READY', 'auto', '{}'::jsonb, 'worker-project'),
  ('worker-outcome-task-2', 'worker-outcome-event-2', 'worker-workspace', 'worker-item-2', 'test failure outcome', 'IMPLEMENTATION', 'L1', 'P2', 'READY', 'auto', '{}'::jsonb, 'worker-project');

INSERT INTO public.agent_execution_runs (
  run_id, actor_id, workspace_id, requested_label, status, project_id
)
VALUES
  ('00000000-0000-4000-8000-00000000e101', 'worker-audit-actor', 'worker-workspace', 'worker-outcome-review', 'ACTIVE', 'worker-project'),
  ('00000000-0000-4000-8000-00000000e102', 'worker-audit-actor', 'worker-workspace', 'worker-outcome-failure', 'ACTIVE', 'worker-project');

CREATE TEMP TABLE worker_outcome_probe (
  attempt_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  run_id UUID NOT NULL,
  lease_generation BIGINT NOT NULL,
  lease_token TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO worker_outcome_probe
SELECT attempt_id, task_id, run_id, lease_generation, lease_token
FROM public.dispatch_agent_attempt(
  'worker-outcome-task-1',
  '00000000-0000-4000-8000-00000000e101',
  'worker-audit-actor',
  'worker-workspace',
  'worker-project',
  'test-provider',
  'worker-outcome-correlation-1'
);

SELECT ok(
  (SELECT count(*) = 1 FROM worker_outcome_probe)
  AND (SELECT status = 'CLAIMED' AND lease_token IS NOT NULL
       FROM public.agent_tasks WHERE task_id = 'worker-outcome-task-1'),
  'dispatch returns one active fenced lease for outcome persistence'
);

SELECT is(
  public.record_agent_attempt_outcome(
    (SELECT attempt_id FROM worker_outcome_probe LIMIT 1),
    'worker-outcome-task-1',
    'worker-audit-actor',
    (SELECT lease_generation FROM worker_outcome_probe LIMIT 1),
    (SELECT lease_token FROM worker_outcome_probe LIMIT 1),
    'VERIFYING',
    '{"summary":"Reviewable result","evidenceRefs":["urn:test:123"],"changedPaths":["src/lib/example.ts"]}'::jsonb
  ),
  true,
  'fenced VERIFYING outcome is persisted'
);

SELECT ok(
  (SELECT status = 'REVIEW' AND owner = 'worker-audit-actor'
      AND lease_generation = (SELECT lease_generation FROM worker_outcome_probe LIMIT 1)
    FROM public.agent_tasks WHERE task_id = 'worker-outcome-task-1')
  AND (SELECT status = 'VERIFYING' AND finished_at IS NULL
    FROM public.agent_execution_attempts WHERE attempt_id = (SELECT attempt_id FROM worker_outcome_probe LIMIT 1))
  AND (SELECT status = 'COMPLETED' FROM public.agent_execution_runs WHERE run_id = '00000000-0000-4000-8000-00000000e101'),
  'review outcome preserves implementer identity and closes the execution run without accepting work'
);

SELECT is(
  public.record_agent_attempt_outcome(
    (SELECT attempt_id FROM worker_outcome_probe LIMIT 1),
    'worker-outcome-task-1',
    'worker-audit-actor',
    (SELECT lease_generation FROM worker_outcome_probe LIMIT 1),
    (SELECT lease_token FROM worker_outcome_probe LIMIT 1),
    'VERIFYING',
    '{"summary":"Reviewable result","evidenceRefs":["urn:test:123"],"changedPaths":["src/lib/example.ts"]}'::jsonb
  ),
  true,
  'an identical retry is idempotent after the run completes'
);

SELECT is(
  (SELECT jsonb_array_length(evidence) FROM public.agent_execution_attempts
   WHERE attempt_id = (SELECT attempt_id FROM worker_outcome_probe LIMIT 1)),
  1,
  'idempotent replay does not duplicate outcome evidence'
);

SELECT throws_ok(
  $$ SELECT public.record_agent_attempt_outcome(
    (SELECT attempt_id FROM worker_outcome_probe LIMIT 1),
    'worker-outcome-task-1',
    'worker-audit-actor',
    (SELECT lease_generation FROM worker_outcome_probe LIMIT 1),
    'forged-lease-token',
    'VERIFYING',
    '{"summary":"Reviewable result","evidenceRefs":["urn:test:123"],"changedPaths":["src/lib/example.ts"]}'::jsonb
  ) $$,
  'P0001',
  'lease fencing token mismatch',
  'the outcome RPC rejects a forged lease token even on an otherwise idempotent retry'
);

INSERT INTO worker_outcome_probe
SELECT attempt_id, task_id, run_id, lease_generation, lease_token
FROM public.dispatch_agent_attempt(
  'worker-outcome-task-2',
  '00000000-0000-4000-8000-00000000e102',
  'worker-audit-actor',
  'worker-workspace',
  'worker-project',
  'test-provider',
  'worker-outcome-correlation-2'
);

SELECT is(
  public.record_agent_attempt_outcome(
    (SELECT attempt_id FROM worker_outcome_probe WHERE task_id = 'worker-outcome-task-2' LIMIT 1),
    'worker-outcome-task-2',
    'worker-audit-actor',
    (SELECT lease_generation FROM worker_outcome_probe WHERE task_id = 'worker-outcome-task-2' LIMIT 1),
    (SELECT lease_token FROM worker_outcome_probe WHERE task_id = 'worker-outcome-task-2' LIMIT 1),
    'PROVIDER_FAILED',
    '{"message":"Provider execution failed; raw provider diagnostics were withheld."}'::jsonb
  ),
  true,
  'fenced provider failure is persisted'
);

SELECT ok(
  (SELECT status = 'BLOCKED' AND owner IS NULL AND lease_token IS NULL AND lease_expiry IS NULL
    FROM public.agent_tasks WHERE task_id = 'worker-outcome-task-2')
  AND (SELECT status = 'FAILED' AND finished_at IS NOT NULL
    FROM public.agent_execution_attempts WHERE attempt_id = (
      SELECT attempt_id FROM worker_outcome_probe WHERE task_id = 'worker-outcome-task-2' LIMIT 1
    ))
  AND (SELECT status = 'FAILED' FROM public.agent_execution_runs WHERE run_id = '00000000-0000-4000-8000-00000000e102'),
  'failure closes the run and attempt and releases the task lease'
);

SELECT * FROM finish();
ROLLBACK;
