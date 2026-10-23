-- Extend the existing private report pipeline to published listings, open public
-- needs, and discoverable profiles. This is source-only until independently
-- reviewed and replayed in a named disposable Supabase project.

ALTER TABLE public.content_reports
  DROP CONSTRAINT IF EXISTS content_reports_subject_type_check;

ALTER TABLE public.content_reports
  ADD CONSTRAINT content_reports_subject_type_check
  CHECK (
    subject_type IN (
      'profile',
      'connection_request',
      'connection_message',
      'listing',
      'need'
    )
  );

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

  IF NEW.subject_type = 'connection_request' THEN
    SELECT r.sender_id, r.recipient_id
      INTO request_sender, request_recipient
      FROM public.connection_requests AS r
     WHERE r.id = NEW.subject_id;

    -- A missing, hidden, blocked or unrelated request is unavailable.
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

  ELSIF NEW.subject_type = 'listing' THEN
    -- Caller-visible public read policy decides if this record can be reported.
    SELECT l.creator_id
      INTO expected_reported_user
      FROM public.listings AS l
     WHERE l.id = NEW.subject_id
       AND l.status = 'published';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'That public listing is not available for reporting'
        USING ERRCODE = '42501';
    END IF;

  ELSIF NEW.subject_type = 'need' THEN
    SELECT n.creator_id
      INTO expected_reported_user
      FROM public.needs AS n
     WHERE n.id = NEW.subject_id
       AND n.status = 'open'
       AND n.visibility IN ('public', 'local_discovery');

    IF NOT FOUND THEN
      RAISE EXCEPTION 'That public need is not available for reporting'
        USING ERRCODE = '42501';
    END IF;

  ELSIF NEW.subject_type = 'profile' THEN
    SELECT p.id
      INTO expected_reported_user
      FROM public.profiles AS p
     WHERE p.id = NEW.subject_id
       AND p.discoverable IS TRUE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'That discoverable profile is not available for reporting'
        USING ERRCODE = '42501';
    END IF;

  ELSE
    RAISE EXCEPTION 'This report subject type is not available through the client API'
      USING ERRCODE = '42501';
  END IF;

  IF expected_reported_user IS NOT NULL AND expected_reported_user = actor THEN
    RAISE EXCEPTION 'You cannot report your own content'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.reported_user_id IS DISTINCT FROM expected_reported_user THEN
    RAISE EXCEPTION 'The report target must match the actual public subject'
      USING ERRCODE = '42501';
  END IF;

  -- Reporting is a request for review, never a verdict or public reputation score.
  NEW.note := left(COALESCE(NEW.note, ''), 1000);
  NEW.status := 'submitted';

  RETURN NEW;
END;
$function$;

-- Enforce report validation for direct table inserts, including PostgREST.
DROP TRIGGER IF EXISTS guard_content_report_insert
  ON public.content_reports;

CREATE TRIGGER guard_content_report_insert
  BEFORE INSERT ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_content_report_insert();

REVOKE ALL ON FUNCTION private.guard_content_report_insert()
  FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION private.guard_content_report_insert() IS
  'Validates that a report is filed by its authenticated reporter against a real, caller-visible public subject and its actual owner. A report is not a moderation decision.';
