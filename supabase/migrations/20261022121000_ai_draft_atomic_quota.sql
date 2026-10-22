-- Durable, atomic per-account limits for billable AI draft generation.
-- This migration is source-only until it is independently reviewed and replayed
-- on a named disposable Supabase project. Never apply directly to production.

CREATE TABLE public.ai_draft_rate_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hour_started_at timestamptz NOT NULL,
  hour_count integer NOT NULL DEFAULT 0 CHECK (hour_count >= 0),
  day_started_at timestamptz NOT NULL,
  day_count integer NOT NULL DEFAULT 0 CHECK (day_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ai_draft_rate_limits IS
  'Minimal per-account aggregate counters for AI draft quotas; contains no prompt text or provider payloads.';

ALTER TABLE public.ai_draft_rate_limits ENABLE ROW LEVEL SECURITY;

-- The rate-limit ledger is private to the SECURITY DEFINER function.
REVOKE ALL ON TABLE public.ai_draft_rate_limits FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.consume_ai_draft_quota()
RETURNS TABLE (allowed boolean, retry_after_seconds integer, limit_kind text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_user_id uuid;
  v_now timestamptz;
  v_hour_start timestamptz;
  v_day_start timestamptz;
  v_hour_count integer;
  v_day_count integer;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 'unauthenticated'::text;
    RETURN;
  END IF;

  v_now := clock_timestamp();
  -- Use fixed UTC windows so a deployment/session timezone cannot change quotas.
  v_hour_start := date_trunc('hour', v_now AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_day_start := date_trunc('day', v_now AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';

  -- The unique user row serializes concurrent requests across app instances.
  -- Each call consumes one attempt; failed or blocked attempts cannot evade
  -- the limit by racing requests or by replaying the same valid payload.
  INSERT INTO public.ai_draft_rate_limits AS existing (
    user_id, hour_started_at, hour_count, day_started_at, day_count, updated_at
  )
  VALUES (v_user_id, v_hour_start, 1, v_day_start, 1, v_now)
  ON CONFLICT (user_id) DO UPDATE
  SET
    hour_count = CASE
      WHEN existing.hour_started_at = EXCLUDED.hour_started_at THEN existing.hour_count + 1
      ELSE 1
    END,
    hour_started_at = EXCLUDED.hour_started_at,
    day_count = CASE
      WHEN existing.day_started_at = EXCLUDED.day_started_at THEN existing.day_count + 1
      ELSE 1
    END,
    day_started_at = EXCLUDED.day_started_at,
    updated_at = EXCLUDED.updated_at
  RETURNING hour_count, day_count INTO v_hour_count, v_day_count;

  IF v_day_count > 20 THEN
    RETURN QUERY SELECT
      false,
      greatest(1, ceil(extract(epoch FROM (v_day_start + interval '1 day' - v_now)))::integer),
      'daily'::text;
    RETURN;
  END IF;

  IF v_hour_count > 5 THEN
    RETURN QUERY SELECT
      false,
      greatest(1, ceil(extract(epoch FROM (v_hour_start + interval '1 hour' - v_now)))::integer),
      'hourly'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 0, 'allowed'::text;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_ai_draft_quota() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_draft_quota() TO authenticated;

COMMENT ON FUNCTION public.consume_ai_draft_quota() IS
  'Atomically consumes one signed-in account quota attempt: 5 per UTC hour and 20 per UTC day.';
