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
  note,
  context_title,
  context_place,
  context_when
) ON TABLE public.connection_requests TO authenticated;
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
