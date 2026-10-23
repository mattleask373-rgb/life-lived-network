-- Harden connection authorization at the database boundary.
-- Authenticated clients can call PostgREST directly, so app-only checks are insufficient.

-- RLS predicates use this private helper. The private schema is not part of the
-- exposed Supabase API schemas, but the authenticated role needs EXECUTE to
-- evaluate the row policies that call it.
GRANT EXECUTE ON FUNCTION private.people_are_blocked(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_connection_request_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_need_creator uuid;
  v_need_title text;
  v_need_place_text text;
  v_need_starts_at timestamptz;
  v_need_timezone text;
BEGIN
  IF current_user IN ('postgres', 'service_role') OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'connection request sender must be the signed-in user' USING ERRCODE = '42501';
  END IF;
  IF NEW.status IS DISTINCT FROM 'sent' THEN
    RAISE EXCEPTION 'new connection requests must start in sent status' USING ERRCODE = '42501';
  END IF;

  SELECT n.creator_id, n.title, n.place_text, n.starts_at, n.timezone
    INTO v_need_creator, v_need_title, v_need_place_text, v_need_starts_at, v_need_timezone
  FROM public.needs AS n
  WHERE n.id = NEW.need_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'the referenced need is not available to this user' USING ERRCODE = '42501';
  END IF;

  IF NEW.direction = 'invite' THEN
    IF v_need_creator IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'only the person who posted a need can invite someone' USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.direction = 'offer' THEN
    IF NEW.recipient_id IS DISTINCT FROM v_need_creator THEN
      RAISE EXCEPTION 'an offer must go to the person who posted the need' USING ERRCODE = '42501';
    END IF;
  ELSE
    RAISE EXCEPTION 'invalid connection request direction' USING ERRCODE = '42501';
  END IF;

  -- Prevent clients from fabricating the context shown to the recipient.
  NEW.note := left(coalesce(NEW.note, ''), 600);
  NEW.context_title := v_need_title;
  NEW.context_place := coalesce(nullif(v_need_place_text, ''), 'Nearby');
  NEW.context_when := CASE
    WHEN v_need_starts_at IS NULL THEN 'Time still to agree'
    ELSE to_char(v_need_starts_at AT TIME ZONE 'UTC', 'Dy, DD Mon YYYY')
      || ' (' || v_need_timezone || ')'
  END;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_connection_request_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role') OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Keep participant IDs and the historical request/context immutable.
  IF ROW(
    NEW.id, NEW.need_id, NEW.sender_id, NEW.recipient_id, NEW.direction, NEW.note,
    NEW.context_title, NEW.context_place, NEW.context_when, NEW.created_at
  ) IS DISTINCT FROM ROW(
    OLD.id, OLD.need_id, OLD.sender_id, OLD.recipient_id, OLD.direction, OLD.note,
    OLD.context_title, OLD.context_place, OLD.context_when, OLD.created_at
  ) THEN
    RAISE EXCEPTION 'connection request details cannot be changed' USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status <> 'sent' THEN
      RAISE EXCEPTION 'a settled connection request cannot be reopened' USING ERRCODE = '42501';
    ELSIF auth.uid() = OLD.recipient_id AND NEW.status IN ('accepted', 'declined') THEN
      RETURN NEW;
    ELSIF auth.uid() = OLD.sender_id AND NEW.status = 'withdrawn' THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'this participant cannot make that connection status transition' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_connection_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_sender_id uuid;
  v_recipient_id uuid;
BEGIN
  IF current_user IN ('postgres', 'service_role') OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.sender_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'message sender must be the signed-in user' USING ERRCODE = '42501';
  END IF;

  -- Lock the request so a close and new message serialize rather than racing.
  SELECT r.status, r.sender_id, r.recipient_id
    INTO v_status, v_sender_id, v_recipient_id
  FROM public.connection_requests AS r
  WHERE r.id = NEW.request_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'the connection request is not available to this user' USING ERRCODE = '42501';
  END IF;
  IF auth.uid() NOT IN (v_sender_id, v_recipient_id) THEN
    RAISE EXCEPTION 'only participants can send messages' USING ERRCODE = '42501';
  END IF;
  IF v_status NOT IN ('sent', 'accepted') THEN
    RAISE EXCEPTION 'this connection is closed to new messages' USING ERRCODE = '42501';
  END IF;
  IF private.people_are_blocked(v_sender_id, v_recipient_id) THEN
    RAISE EXCEPTION 'messages are not permitted between these participants' USING ERRCODE = '42501';
  END IF;

  NEW.body := left(trim(coalesce(NEW.body, '')), 600);
  IF NEW.body = '' THEN
    RAISE EXCEPTION 'message body must not be empty' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_connection_request_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_connection_request_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_connection_message_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS connection_requests_guard_insert ON public.connection_requests;
CREATE TRIGGER connection_requests_guard_insert
  BEFORE INSERT ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_connection_request_insert();

DROP TRIGGER IF EXISTS connection_requests_guard_update ON public.connection_requests;
CREATE TRIGGER connection_requests_guard_update
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_connection_request_update();

DROP TRIGGER IF EXISTS connection_messages_guard_insert ON public.connection_messages;
CREATE TRIGGER connection_messages_guard_insert
  BEFORE INSERT ON public.connection_messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_connection_message_insert();

-- User clients may create request content but not choose IDs, timestamps, or initial status.
REVOKE INSERT ON TABLE public.connection_requests FROM authenticated;
GRANT INSERT (
  need_id, sender_id, recipient_id, direction, note, context_title, context_place, context_when
) ON TABLE public.connection_requests TO authenticated;

-- User clients may submit message content only; the database owns identity/timestamps.
REVOKE INSERT ON TABLE public.connection_messages FROM authenticated;
GRANT INSERT (request_id, sender_id, body) ON TABLE public.connection_messages TO authenticated;

-- User clients may update status only; the trigger validates the actor and transition.
REVOKE UPDATE ON TABLE public.connection_requests FROM authenticated;
GRANT UPDATE (status) ON TABLE public.connection_requests TO authenticated;

-- Enforce open-state messaging in RLS as well as the locking trigger.
DROP POLICY IF EXISTS "Unblocked participants can add messages" ON public.connection_messages;
CREATE POLICY "Unblocked participants can add messages to open requests"
  ON public.connection_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.connection_requests r
      WHERE r.id = connection_messages.request_id
        AND r.status IN ('sent', 'accepted')
        AND (auth.uid() = r.sender_id OR auth.uid() = r.recipient_id)
        AND NOT private.people_are_blocked(r.sender_id, r.recipient_id)
    )
  );
