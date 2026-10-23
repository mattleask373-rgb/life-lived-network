-- Phase 3 reconciliation: make durable task lifecycle states match
-- the lease/recovery state machine already used by the control plane.

ALTER TABLE public.agent_tasks
  DROP CONSTRAINT IF EXISTS agent_tasks_status_check;

ALTER TABLE public.agent_tasks
  ADD CONSTRAINT agent_tasks_status_check
  CHECK (status IN (
    'READY',
    'CLAIMED',
    'IN_PROGRESS',
    'VERIFYING',
    'BLOCKED',
    'CHANGES_REQUESTED',
    'REVIEW',
    'ACCEPTED',
    'INTEGRATED',
    'STALE',
    'ABANDONED',
    'CANCELLED',
    'DONE'
  ));
