-- Rebuild private conversation/safety grants from least privilege and
-- enforce the existing state machines at the database boundary.
-- Review and two-account test before applying to any hosted environment.

REVOKE ALL PRIVILEGES ON TABLE
  public.connection_requests,
  public.connection_messages,
  public.user_blocks,
  public.content_reports
FROM PUBLIC, anon, authenticated;

-- Requests: clients may read their own requests, create a request using only
-- input columns (status/id/timestamps remain database-owned), and update status.
GRANT SELECT ON TABLE public.connection_requests TO authenticated;
GRANT INSERT (
  need_id,
  sender_id,
  recipient_id,
  direction,
  note
) ON TABLE public.connection_requests TO authenticated;

-- A table INSERT policy only checks the actor and block relation. Enforce the
-- application-level need/recipient/direction contract here too, and create the
-- frozen context from the actual need row rather than trusting client input.
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
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF actor IS NULL OR NEW.sender_id IS DISTINCT FROM actor THEN
    RAISE EXCEPTION 'A connection request must be sent by the authenticated account'
      USING ERRCODE = '42501';
  END IF;

  SELECT n.creator_id, n.status, n.title, n.place_text, n.starts_at, n.timezone, n.expires_at
    INTO need_creator, need_status, need_title, need_place_text, need_starts_at, need_timezone, need_expires_at
    FROM public.needs AS n
   WHERE n.id = NEW.need_id;

  -- The query intentionally runs as the caller, so needs RLS remains in force.
  -- A private/unavailable need, missing need, or closed need fails closed.
  IF NOT FOUND
     OR need_status IS DISTINCT FROM 'open'
     OR (need_expires_at IS NOT NULL AND need_expires_at <= now()) THEN
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

  -- Frozen context is derived here. Client-supplied context columns are not
  -- granted for INSERT, and cannot be used to spoof the subject of a request.
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

DROP TRIGGER IF EXISTS connection_requests_insert_guard
  ON public.connection_requests;

CREATE TRIGGER connection_requests_insert_guard
  BEFORE INSERT ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_connection_request_insert();
GRANT UPDATE (status) ON TABLE public.connection_requests TO authenticated;

CREATE OR REPLACE FUNCTION private.guard_connection_request_status_transition()
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
    RAISE EXCEPTION 'Conversation identity and captured context cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  IF actor IS NULL THEN
    RAISE EXCEPTION 'An authenticated participant is required'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Recipient answers; sender may withdraw. Settled requests are final.
  IF OLD.status <> 'sent' THEN
    RAISE EXCEPTION 'A settled conversation request cannot be reopened'
      USING ERRCODE = '42501';
  END IF;

  IF actor = OLD.recipient_id AND NEW.status IN ('accepted', 'declined') THEN
    RETURN NEW;
  END IF;

  IF actor = OLD.sender_id AND NEW.status = 'withdrawn' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'This participant cannot make the requested status transition'
    USING ERRCODE = '42501';
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_connection_request_status_transition()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS connection_requests_status_guard
  ON public.connection_requests;

CREATE TRIGGER connection_requests_status_guard
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_connection_request_status_transition();

-- Messages: read and append only. Database-generated id/timestamps are not
-- client-writable. There is no edit/delete path for message history.
GRANT SELECT ON TABLE public.connection_messages TO authenticated;
GRANT INSERT (request_id, sender_id, body)
  ON TABLE public.connection_messages TO authenticated;

CREATE OR REPLACE FUNCTION private.guard_connection_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  actor uuid := auth.uid();
  request_status text;
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF actor IS NULL OR NEW.sender_id IS DISTINCT FROM actor THEN
    RAISE EXCEPTION 'A message must be sent by the authenticated account'
      USING ERRCODE = '42501';
  END IF;

  SELECT r.status
    INTO request_status
    FROM public.connection_requests AS r
   WHERE r.id = NEW.request_id;

  -- A row hidden by participant/block RLS is treated as unavailable.
  IF NOT FOUND OR request_status NOT IN ('sent', 'accepted') THEN
    RAISE EXCEPTION 'This conversation is not open for messages'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_connection_message_insert()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS connection_messages_insert_guard
  ON public.connection_messages;

CREATE TRIGGER connection_messages_insert_guard
  BEFORE INSERT ON public.connection_messages
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_connection_message_insert();

-- Reports: direct table writes must not allow fabricated accusations about an
-- unrelated account. The only currently implemented client report path is a
-- private connection request; future subject types need their own explicit
-- validation path rather than silently inheriting this grant.
CREATE OR REPLACE FUNCTION private.guard_content_report_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  actor uuid := auth.uid();
  request_sender uuid;
  request_recipient uuid;
  expected_reported_user uuid;
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF actor IS NULL OR NEW.reporter_id IS DISTINCT FROM actor THEN
    RAISE EXCEPTION 'A report must be filed by the authenticated account'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.subject_type IS DISTINCT FROM 'connection_request' THEN
    RAISE EXCEPTION 'This report subject type is not available through the client API'
      USING ERRCODE = '42501';
  END IF;

  SELECT r.sender_id, r.recipient_id
    INTO request_sender, request_recipient
    FROM public.connection_requests AS r
   WHERE r.id = NEW.subject_id;

  -- The SELECT runs under the caller's row policies. A missing, hidden,
  -- blocked or unrelated request is treated as unavailable.
  IF NOT FOUND THEN
    RAISE EXCEPTION 'That conversation is not available for reporting'
      USING ERRCODE = '42501';
  END IF;

  IF actor = request_sender THEN
    expected_reported_user := request_recipient;
  ELSIF actor = request_recipient THEN
    expected_reported_user := request_sender;
  ELSE
    RAISE EXCEPTION 'Only a conversation participant may report it'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.reported_user_id IS DISTINCT FROM expected_reported_user THEN
    RAISE EXCEPTION 'The report target must be the other conversation participant'
      USING ERRCODE = '42501';
  END IF;

  -- Keep the same bounds and status contract as the authenticated server path.
  NEW.note := left(COALESCE(NEW.note, ''), 1000);
  NEW.status := 'submitted';

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.guard_content_report_insert()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS content_reports_insert_guard
  ON public.content_reports;

CREATE TRIGGER content_reports_insert_guard
  BEFORE INSERT ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_content_report_insert();

-- Blocks: users can see/create/remove their own block records, but cannot edit
-- block identities or timestamps. App-side upsert uses ignoreDuplicates.
GRANT SELECT, DELETE ON TABLE public.user_blocks TO authenticated;
GRANT INSERT (blocker_id, blocked_id)
  ON TABLE public.user_blocks TO authenticated;

-- Reports: reporters can create/read their own; reviewer RLS controls updates.
-- Only the review fields that recordReportReview writes are mutable.
GRANT SELECT ON TABLE public.content_reports TO authenticated;
GRANT INSERT (
  reporter_id,
  reported_user_id,
  subject_type,
  subject_id,
  reason,
  note
) ON TABLE public.content_reports TO authenticated;
GRANT UPDATE (status, resolution, review_note, reviewed_at, reviewed_by)
  ON TABLE public.content_reports TO authenticated;
