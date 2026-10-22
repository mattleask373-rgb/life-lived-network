-- Authenticated durable execution identity boundary.
-- This migration records server-derived run/attempt identity and audit evidence.
-- It does not grant production execution, merge, deploy, or human approval authority.

CREATE TABLE IF NOT EXISTS public.agent_execution_runs (
  run_id UUID PRIMARY KEY,
  actor_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  requested_label TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','COMPLETED','FAILED','CANCELLED','EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.agent_execution_attempts (
  attempt_id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.agent_execution_runs(run_id) ON DELETE RESTRICT,
  task_id TEXT NOT NULL REFERENCES public.agent_tasks(task_id) ON DELETE RESTRICT,
  workspace_id TEXT NOT NULL,
  lease_generation BIGINT,
  lease_token TEXT,
  correlation_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('DISPATCHED','RUNNING','VERIFYING','SUCCEEDED','FAILED','STALE','CANCELLED')),
  provider_id TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS agent_execution_attempts_task_idx
  ON public.agent_execution_attempts (task_id, started_at DESC);
CREATE INDEX IF NOT EXISTS agent_execution_attempts_run_idx
  ON public.agent_execution_attempts (run_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_execution_audit (
  audit_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.agent_execution_runs(run_id) ON DELETE RESTRICT,
  attempt_id UUID REFERENCES public.agent_execution_attempts(attempt_id) ON DELETE RESTRICT,
  actor_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_execution_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_execution_runs_no_client_access" ON public.agent_execution_runs;
DROP POLICY IF EXISTS "agent_execution_attempts_no_client_access" ON public.agent_execution_attempts;
DROP POLICY IF EXISTS "agent_execution_audit_no_client_access" ON public.agent_execution_audit;
CREATE POLICY "agent_execution_runs_no_client_access" ON public.agent_execution_runs FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "agent_execution_attempts_no_client_access" ON public.agent_execution_attempts FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "agent_execution_audit_no_client_access" ON public.agent_execution_audit FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

REVOKE ALL ON TABLE public.agent_execution_runs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.agent_execution_attempts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.agent_execution_audit FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT SELECT, INSERT, UPDATE ON public.agent_execution_runs TO service_role;
    GRANT SELECT, INSERT, UPDATE ON public.agent_execution_attempts TO service_role;
    GRANT SELECT, INSERT ON public.agent_execution_audit TO service_role;
  END IF;
END $$;
