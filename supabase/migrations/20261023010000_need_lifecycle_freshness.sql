-- Align public Need discovery with the existing lifecycle/freshness fields.
-- A need must be open, public/local-discovery, within any declared time window,
-- and reconfirmed within 30 days to count as current demand.
--
-- Owner-controlled close-loop actions remain owner-scoped. This migration is
-- source-only until the full chain and authorization tests pass; do not apply
-- directly to a hosted database.

DROP POLICY IF EXISTS "Public needs are readable by anyone" ON public.needs;
DROP POLICY IF EXISTS "Current public needs are readable by anyone" ON public.needs;

CREATE POLICY "Current public needs are readable by anyone"
  ON public.needs FOR SELECT
  USING (
    visibility IN ('public', 'local_discovery')
    AND status = 'open'
    AND (expires_at IS NULL OR expires_at > now())
    AND (ends_at IS NULL OR ends_at > now())
    AND last_confirmed_at > now() - interval '30 days'
  );

CREATE INDEX IF NOT EXISTS needs_public_freshness_idx
  ON public.needs (place_id, last_confirmed_at DESC)
  WHERE status = 'open' AND visibility IN ('public', 'local_discovery');

-- Restrict lifecycle changes even when an authenticated client uses PostgREST
-- directly rather than the owner-facing server function. Closed asks cannot
-- be reopened by an ordinary client; an explicit time window cannot be
-- refreshed after it has ended. Owners can only close their own open asks.
CREATE OR REPLACE FUNCTION private.guard_need_lifecycle_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  actor uuid := auth.uid();
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF actor IS NULL
     OR OLD.creator_id IS DISTINCT FROM actor
     OR NEW.creator_id IS DISTINCT FROM OLD.creator_id THEN
    RAISE EXCEPTION 'Only the need owner may change its lifecycle'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status IS DISTINCT FROM 'open' THEN
      RAISE EXCEPTION 'A closed need cannot be reopened'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.status NOT IN ('met', 'withdrawn') THEN
      RAISE EXCEPTION 'An owner may mark an open need met or withdrawn'
        USING ERRCODE = '42501';
    END IF;
    -- The server timestamp is the evidence that the owner acted on this need.
    NEW.last_confirmed_at := statement_timestamp();
  ELSIF NEW.last_confirmed_at IS DISTINCT FROM OLD.last_confirmed_at THEN
    IF NEW.last_confirmed_at > statement_timestamp() THEN
      RAISE EXCEPTION 'A need confirmation cannot be in the future'
        USING ERRCODE = '22023';
    END IF;
    IF (OLD.expires_at IS NOT NULL AND OLD.expires_at <= statement_timestamp())
       OR (OLD.ends_at IS NOT NULL AND OLD.ends_at <= statement_timestamp()) THEN
      RAISE EXCEPTION 'A need whose stated time window has ended cannot be reconfirmed'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_need_lifecycle_update()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS needs_lifecycle_update_guard ON public.needs;
CREATE TRIGGER needs_lifecycle_update_guard
  BEFORE UPDATE ON public.needs
  FOR EACH ROW EXECUTE FUNCTION private.guard_need_lifecycle_update();

-- Keep direct connection writes aligned with public discovery. The existing
-- RLS predicate is the first guard; these explicit checks retain the contract
-- if this trigger's read path is changed in the future.
CREATE OR REPLACE FUNCTION private.guard_connection_request_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  actor uuid := auth.uid();
  need_creator uuid;
  need_status text;
  need_title text;
  need_place_text text;
  need_starts_at timestamptz;
  need_timezone text;
  need_expires_at timestamptz;
  need_ends_at timestamptz;
  need_last_confirmed_at timestamptz;
  need_visibility text;
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF actor IS NULL OR NEW.sender_id IS DISTINCT FROM actor THEN
    RAISE EXCEPTION 'A connection request must be sent by the authenticated account'
      USING ERRCODE = '42501';
  END IF;

  SELECT n.creator_id, n.status, n.title, n.place_text, n.starts_at, n.timezone,
         n.expires_at, n.ends_at, n.last_confirmed_at, n.visibility
    INTO need_creator, need_status, need_title, need_place_text, need_starts_at,
         need_timezone, need_expires_at, need_ends_at, need_last_confirmed_at, need_visibility
    FROM public.needs AS n
   WHERE n.id = NEW.need_id;

  IF NOT FOUND
     OR need_status IS DISTINCT FROM 'open'
     OR need_visibility NOT IN ('public', 'local_discovery')
     OR (need_expires_at IS NOT NULL AND need_expires_at <= now())
     OR (need_ends_at IS NOT NULL AND need_ends_at <= now())
     OR need_last_confirmed_at <= now() - interval '30 days' THEN
    RAISE EXCEPTION 'That need is not available for a connection request'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.direction = 'offer' THEN
    IF NEW.recipient_id IS DISTINCT FROM need_creator THEN
      RAISE EXCEPTION 'An offer must go to the person who posted the need'
        USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.direction = 'invite' THEN
    IF actor IS DISTINCT FROM need_creator THEN
      RAISE EXCEPTION 'Only the person who posted the need may invite someone'
        USING ERRCODE = '42501';
    END IF;
  ELSE
    RAISE EXCEPTION 'A valid connection request direction is required'
      USING ERRCODE = '42501';
  END IF;

  IF char_length(COALESCE(NEW.note, '')) > 600 THEN
    RAISE EXCEPTION 'The connection request note is too long'
      USING ERRCODE = '22001';
  END IF;

  NEW.context_title := need_title;
  NEW.context_place := COALESCE(NULLIF(need_place_text, ''), 'Nearby');
  NEW.context_when := CASE
    WHEN need_starts_at IS NULL THEN 'Time still to agree'
    ELSE to_char(need_starts_at AT TIME ZONE 'UTC', 'Dy, DD Mon YYYY')
      || ' (' || need_timezone || ')'
  END;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_connection_request_insert()
  FROM PUBLIC, anon, authenticated;
