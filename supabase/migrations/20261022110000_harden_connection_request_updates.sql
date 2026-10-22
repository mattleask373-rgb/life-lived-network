-- Restrict user-driven connection updates to a valid, participant-authorized status transition.
-- The application handler also uses compare-and-set, but the database must enforce this
-- independently because authenticated clients can call Supabase/PostgREST directly.

CREATE OR REPLACE FUNCTION public.guard_connection_request_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Trusted server/database operators retain the ability to perform maintenance.
  IF current_user IN ('postgres', 'service_role') OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Participants may change the status only; the request and its historical context
  -- are immutable after creation.
  IF ROW(
    NEW.id,
    NEW.need_id,
    NEW.sender_id,
    NEW.recipient_id,
    NEW.direction,
    NEW.note,
    NEW.context_title,
    NEW.context_place,
    NEW.context_when,
    NEW.created_at
  ) IS DISTINCT FROM ROW(
    OLD.id,
    OLD.need_id,
    OLD.sender_id,
    OLD.recipient_id,
    OLD.direction,
    OLD.note,
    OLD.context_title,
    OLD.context_place,
    OLD.context_when,
    OLD.created_at
  ) THEN
    RAISE EXCEPTION 'connection request details cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status <> 'sent' THEN
      RAISE EXCEPTION 'a settled connection request cannot be reopened'
        USING ERRCODE = '42501';
    ELSIF auth.uid() = OLD.recipient_id AND NEW.status IN ('accepted', 'declined') THEN
      RETURN NEW;
    ELSIF auth.uid() = OLD.sender_id AND NEW.status = 'withdrawn' THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'this participant cannot make that connection status transition'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_connection_request_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS connection_requests_guard_update ON public.connection_requests;
CREATE TRIGGER connection_requests_guard_update
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_connection_request_update();

-- Revoke the table-wide update privilege from users. The app and direct clients
-- can update only status; the trigger above enforces actor, transition, and
-- immutability rules at the database boundary.
REVOKE UPDATE ON TABLE public.connection_requests FROM authenticated;
GRANT UPDATE (status) ON TABLE public.connection_requests TO authenticated;
