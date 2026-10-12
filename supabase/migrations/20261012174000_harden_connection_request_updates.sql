-- Restrict conversation-request changes at the database boundary.
-- This migration is proposed on a review branch only. Do not apply to the hosted
-- project until the migration and the two-account integration checks are reviewed.

-- These tables contain private conversation/safety records and have no anonymous
-- RLS policies. Remove grants for both PUBLIC and anon as defense in depth.
REVOKE ALL PRIVILEGES ON TABLE
  public.connection_requests,
  public.connection_messages,
  public.user_blocks,
  public.content_reports
FROM PUBLIC, anon;

-- Remove table-level and any explicit column-level UPDATE grants, then allow a
-- signed-in participant to submit only the status column. RLS still limits which
-- rows they can update; the trigger below limits who can make each transition.
REVOKE UPDATE ON TABLE public.connection_requests FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (
  id,
  need_id,
  sender_id,
  recipient_id,
  direction,
  note,
  status,
  context_title,
  context_place,
  context_when,
  created_at,
  updated_at
) ON TABLE public.connection_requests FROM PUBLIC, anon, authenticated;
GRANT UPDATE (status) ON TABLE public.connection_requests TO authenticated;

CREATE OR REPLACE FUNCTION private.guard_connection_request_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  actor uuid := auth.uid();
BEGIN
  -- Allow trusted database maintenance paths, not ordinary client requests.
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

  -- Status-preserving updates are harmless, but no other fields are writable
  -- through the authenticated API (the column grant above enforces this).
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- The product state machine is: sent -> accepted/declined by the recipient,
  -- or sent -> withdrawn by the sender. Settled requests are never reopened.
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

-- Trigger-only helper: it should not be callable as an exposed API function.
REVOKE ALL ON FUNCTION private.guard_connection_request_status_transition()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS connection_requests_status_guard
  ON public.connection_requests;

CREATE TRIGGER connection_requests_status_guard
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION private.guard_connection_request_status_transition();
