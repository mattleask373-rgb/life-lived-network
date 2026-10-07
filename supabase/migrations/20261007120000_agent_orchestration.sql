-- Durable control-plane state for provider-neutral agent execution.
CREATE TABLE IF NOT EXISTS public.agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  delivery_id TEXT NOT NULL,
  webhook_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'ignored', 'normalized', 'failed')),
  error TEXT
);
CREATE INDEX IF NOT EXISTS agent_events_received_at_idx ON public.agent_events (received_at DESC);

CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL UNIQUE,
  event_id TEXT NOT NULL REFERENCES public.agent_events(event_id) ON DELETE RESTRICT,
  workspace_id TEXT NOT NULL,
  work_item_id TEXT NOT NULL,
  objective TEXT NOT NULL,
  lane TEXT NOT NULL,
  autonomy TEXT NOT NULL CHECK (autonomy IN ('L0', 'L1', 'L2', 'L3', 'L4')),
  risk TEXT NOT NULL CHECK (risk IN ('P0', 'P1', 'P2', 'P3')),
  status TEXT NOT NULL DEFAULT 'READY' CHECK (status IN ('READY', 'CLAIMED', 'VERIFYING', 'BLOCKED', 'CHANGES_REQUESTED', 'DONE')),
  provider TEXT NOT NULL DEFAULT 'auto',
  envelope JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_tasks_status_idx ON public.agent_tasks (status, risk, created_at);
CREATE INDEX IF NOT EXISTS agent_tasks_work_item_idx ON public.agent_tasks (workspace_id, work_item_id);

ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_events_no_client_access" ON public.agent_events;
DROP POLICY IF EXISTS "agent_tasks_no_client_access" ON public.agent_tasks;
CREATE POLICY "agent_events_no_client_access" ON public.agent_events
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "agent_tasks_no_client_access" ON public.agent_tasks
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
