-- Service / booking facts on the one canonical activity record. No separate
-- service table, no practitioner table: a service is an activity with a
-- provider and a truthful booking state.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS demonstration boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS organisation text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS provider_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS qualification_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS booking_state text NOT NULL DEFAULT 'not_bookable',
  ADD COLUMN IF NOT EXISTS booking_url text NOT NULL DEFAULT '';

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_booking_state_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_booking_state_check
  CHECK (booking_state IN ('bookable', 'enquire', 'external', 'not_bookable'));

-- An external booking claim needs somewhere real to go.
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_booking_url_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_booking_url_check
  CHECK (booking_state <> 'external' OR booking_url <> '');

CREATE INDEX IF NOT EXISTS listings_service_idx
  ON public.listings (place_id, kind, booking_state);

-- Source health, said plainly and without a dashboard.
ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS last_success_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_failure_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error_category text NOT NULL DEFAULT '';