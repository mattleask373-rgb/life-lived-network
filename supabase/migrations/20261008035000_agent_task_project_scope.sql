-- Phase 12 prerequisite: durable task project scope column.
-- Existing tasks are intentionally left NULL until an authoritative project
-- resolver can populate them. Dispatch must reject NULL scope rather than
-- inventing or borrowing the Supabase project identifier.
ALTER TABLE public.agent_tasks
  ADD COLUMN IF NOT EXISTS project_id TEXT;

ALTER TABLE public.agent_tasks
  ADD CONSTRAINT agent_tasks_project_id_nonempty
  CHECK (project_id IS NULL OR NULLIF(btrim(project_id), '') IS NOT NULL);

CREATE INDEX IF NOT EXISTS agent_tasks_scope_idx
  ON public.agent_tasks (workspace_id, project_id, status);
