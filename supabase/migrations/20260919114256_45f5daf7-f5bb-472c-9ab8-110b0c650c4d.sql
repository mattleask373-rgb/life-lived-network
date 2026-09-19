ALTER TABLE public.content_reports
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS resolution text NOT NULL DEFAULT 'awaiting_review',
  ADD COLUMN IF NOT EXISTS review_note text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS content_reports_status_idx ON public.content_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS content_reports_reported_user_idx ON public.content_reports (reported_user_id);

CREATE INDEX IF NOT EXISTS needs_status_visibility_place_idx ON public.needs (status, visibility, place_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_discoverable_place_idx ON public.profiles (discoverable, place_id);
CREATE INDEX IF NOT EXISTS service_areas_place_user_idx ON public.service_areas (place_id, user_id);
CREATE INDEX IF NOT EXISTS person_capabilities_user_idx ON public.person_capabilities (user_id);
CREATE INDEX IF NOT EXISTS availability_windows_user_idx ON public.availability_windows (user_id, starts_at);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON public.user_blocks (blocked_id);