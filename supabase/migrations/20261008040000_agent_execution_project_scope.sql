-- Phase 12 prerequisite repair: execution scope is durable on both run and attempt rows.
-- This migration intentionally fails closed if legacy execution rows already exist
-- without a project scope. We must not invent a project for historical records.
--
-- Ordering: Phase 10 creates the tables first; this migration adds the scope
-- columns before the Phase 10/11 result RPCs reference them.

ALTER TABLE public.agent_execution_runs
  ADD COLUMN IF NOT EXISTS project_id TEXT;

ALTER TABLE public.agent_execution_attempts
  ADD COLUMN IF NOT EXISTS project_id TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.agent_execution_runs
    WHERE project_id IS NULL OR NULLIF(btrim(project_id), '') IS NULL
  ) THEN
    RAISE EXCEPTION
      'cannot add mandatory project scope: existing execution runs lack project_id';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.agent_execution_attempts
    WHERE project_id IS NULL OR NULLIF(btrim(project_id), '') IS NULL
  ) THEN
    RAISE EXCEPTION
      'cannot add mandatory project scope: existing execution attempts lack project_id';
  END IF;
END $$;

ALTER TABLE public.agent_execution_runs
  ALTER COLUMN project_id SET NOT NULL;

ALTER TABLE public.agent_execution_attempts
  ALTER COLUMN project_id SET NOT NULL;

ALTER TABLE public.agent_execution_runs
  ADD CONSTRAINT agent_execution_runs_project_id_nonempty
  CHECK (NULLIF(btrim(project_id), '') IS NOT NULL);

ALTER TABLE public.agent_execution_attempts
  ADD CONSTRAINT agent_execution_attempts_project_id_nonempty
  CHECK (NULLIF(btrim(project_id), '') IS NOT NULL);

CREATE INDEX IF NOT EXISTS agent_execution_runs_scope_idx
  ON public.agent_execution_runs (workspace_id, project_id, status);

CREATE INDEX IF NOT EXISTS agent_execution_attempts_scope_idx
  ON public.agent_execution_attempts (workspace_id, project_id, started_at DESC);
