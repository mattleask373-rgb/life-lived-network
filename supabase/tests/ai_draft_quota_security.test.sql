BEGIN;
SELECT plan(7);

-- Synthetic identities and the quota calls are disposable. The outer transaction
-- rolls back both auth rows and aggregate quota counters.
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
VALUES
(
  'f14e0c44-3c65-4a2a-bac2-55d8863b1e81',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'atlas-quota-a@example.test',
  '',
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb
),
(
  'e532d761-ef87-45d2-aed5-1c9d2a9ee3c3',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'atlas-quota-b@example.test',
  '',
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb
);

CREATE TEMP TABLE quota_probe_results (
  user_id uuid NOT NULL,
  attempt integer NOT NULL,
  allowed boolean NOT NULL,
  retry_after_seconds integer NOT NULL,
  limit_kind text NOT NULL
) ON COMMIT DROP;

GRANT INSERT ON TABLE pg_temp.quota_probe_results TO authenticated;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'f14e0c44-3c65-4a2a-bac2-55d8863b1e81', true);

INSERT INTO pg_temp.quota_probe_results (
  user_id, attempt, allowed, retry_after_seconds, limit_kind
)
SELECT
  'f14e0c44-3c65-4a2a-bac2-55d8863b1e81'::uuid,
  g.attempt,
  q.allowed,
  q.retry_after_seconds,
  q.limit_kind
FROM generate_series(1, 21) AS g(attempt)
CROSS JOIN LATERAL public.consume_ai_draft_quota() AS q;

SELECT set_config('request.jwt.claim.sub', 'e532d761-ef87-45d2-aed5-1c9d2a9ee3c3', true);

INSERT INTO pg_temp.quota_probe_results (
  user_id, attempt, allowed, retry_after_seconds, limit_kind
)
SELECT
  'e532d761-ef87-45d2-aed5-1c9d2a9ee3c3'::uuid,
  1,
  q.allowed,
  q.retry_after_seconds,
  q.limit_kind
FROM public.consume_ai_draft_quota() AS q;

RESET ROLE;

SELECT ok(
  (
    SELECT c.relrowsecurity
      AND NOT has_table_privilege('anon', 'public.ai_draft_rate_limits', 'SELECT')
      AND NOT has_table_privilege('authenticated', 'public.ai_draft_rate_limits', 'SELECT')
      AND NOT has_table_privilege('service_role', 'public.ai_draft_rate_limits', 'SELECT')
    FROM pg_class AS c
    WHERE c.oid = 'public.ai_draft_rate_limits'::regclass
  ),
  'quota ledger keeps RLS enabled and denies direct client reads'
);

SELECT ok(
  (
    SELECT p.prosecdef
      AND p.proconfig IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM unnest(p.proconfig) AS cfg
        WHERE cfg LIKE 'search_path=%'
      )
    FROM pg_proc AS p
    WHERE p.oid = 'public.consume_ai_draft_quota()'::regprocedure
  )
  AND has_function_privilege('authenticated', 'public.consume_ai_draft_quota()', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.consume_ai_draft_quota()', 'EXECUTE')
  AND NOT has_function_privilege('service_role', 'public.consume_ai_draft_quota()', 'EXECUTE'),
  'quota function is definer-scoped with a pinned search path and explicit authenticated-only execution'
);

SELECT is(
  (SELECT count(*) FROM pg_temp.quota_probe_results
   WHERE user_id = 'f14e0c44-3c65-4a2a-bac2-55d8863b1e81' AND allowed),
  5::bigint,
  'the first five attempts in an hour are allowed'
);

SELECT is(
  (SELECT count(*) FROM pg_temp.quota_probe_results
   WHERE user_id = 'f14e0c44-3c65-4a2a-bac2-55d8863b1e81' AND limit_kind = 'hourly'),
  15::bigint,
  'attempts six through twenty are denied by the hourly limit'
);

SELECT is(
  (SELECT count(*) FROM pg_temp.quota_probe_results
   WHERE user_id = 'f14e0c44-3c65-4a2a-bac2-55d8863b1e81' AND limit_kind = 'daily'),
  1::bigint,
  'the twenty-first attempt is denied by the daily limit'
);

SELECT ok(
  (
    SELECT bool_and(retry_after_seconds > 0)
    FROM pg_temp.quota_probe_results
    WHERE NOT allowed
  ),
  'every rejected attempt includes a positive retry delay'
);

SELECT ok(
  (
    SELECT count(*) = 2
    FROM public.ai_draft_rate_limits
    WHERE user_id IN (
      'f14e0c44-3c65-4a2a-bac2-55d8863b1e81',
      'e532d761-ef87-45d2-aed5-1c9d2a9ee3c3'
    )
  )
  AND (
    SELECT allowed
      AND retry_after_seconds = 0
      AND limit_kind = 'allowed'
    FROM pg_temp.quota_probe_results
    WHERE user_id = 'e532d761-ef87-45d2-aed5-1c9d2a9ee3c3'
  ),
  'each account receives an independent quota row and a new account starts with an allowance'
);

SELECT * FROM finish();
ROLLBACK;
