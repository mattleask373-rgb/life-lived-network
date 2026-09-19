CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_blocks_distinct_people CHECK (blocker_id <> blocked_id),
  CONSTRAINT user_blocks_unique_pair UNIQUE (blocker_id, blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blockers can view their blocks" ON public.user_blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "People can create their own blocks" ON public.user_blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "People can remove their own blocks" ON public.user_blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());
CREATE INDEX user_blocks_blocked_lookup_idx ON public.user_blocks (blocked_id, blocker_id);

CREATE TABLE public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_type text NOT NULL CHECK (subject_type IN ('profile', 'connection_request', 'connection_message')),
  subject_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('safety', 'harassment', 'spam', 'misleading', 'other')),
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 1000),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_reports_no_self_report CHECK (reported_user_id IS NULL OR reported_user_id <> reporter_id),
  CONSTRAINT content_reports_unique_subject UNIQUE (reporter_id, subject_type, subject_id)
);
GRANT SELECT, INSERT ON public.content_reports TO authenticated;
GRANT ALL ON public.content_reports TO service_role;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reporters can view their reports" ON public.content_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());
CREATE POLICY "People can submit their own reports" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND status = 'submitted');
CREATE INDEX content_reports_reporter_created_idx ON public.content_reports (reporter_id, created_at DESC);
CREATE INDEX content_reports_review_idx ON public.content_reports (status, created_at ASC);
CREATE TRIGGER touch_content_reports_updated_at BEFORE UPDATE ON public.content_reports FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.listing_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  image_url text NOT NULL CHECK (image_url ~ '^https://'),
  source_url text NOT NULL CHECK (source_url ~ '^https://'),
  credit text NOT NULL DEFAULT '',
  alt_text text NOT NULL DEFAULT '',
  position smallint NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_photos_unique_position UNIQUE (listing_id, position)
);
GRANT SELECT ON public.listing_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_photos TO authenticated;
GRANT ALL ON public.listing_photos TO service_role;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view photos for open listings" ON public.listing_photos FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.status = 'active'));
CREATE POLICY "Owners can add listing photos" ON public.listing_photos FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.creator_id = auth.uid()));
CREATE POLICY "Owners can update listing photos" ON public.listing_photos FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.creator_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.creator_id = auth.uid()));
CREATE POLICY "Owners can remove listing photos" ON public.listing_photos FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.creator_id = auth.uid()));
CREATE INDEX listing_photos_listing_position_idx ON public.listing_photos (listing_id, position);

CREATE OR REPLACE FUNCTION public.people_are_blocked(_first uuid, _second uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _first AND blocked_id = _second)
       OR (blocker_id = _second AND blocked_id = _first)
  )
$$;
REVOKE ALL ON FUNCTION public.people_are_blocked(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.people_are_blocked(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.people_are_blocked(uuid, uuid) TO service_role;