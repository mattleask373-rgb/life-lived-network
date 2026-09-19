-- Sources: every outside origin of activity, plus its health. Generic by design:
-- a source is data, never code, so a new locality is a new row.
CREATE TABLE public.sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('platform', 'venue', 'civic', 'community', 'resident')),
  access_method text NOT NULL CHECK (access_method IN ('api', 'feed', 'structured_page', 'manual')),
  homepage_url text NOT NULL DEFAULT '',
  terms_url text NOT NULL DEFAULT '',
  attribution text NOT NULL DEFAULT '',
  store_images boolean NOT NULL DEFAULT false,
  refresh_minutes integer NOT NULL DEFAULT 1440 CHECK (refresh_minutes >= 15),
  place_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'requires_review'
    CHECK (status IN ('ready', 'requires_credentials', 'requires_review', 'not_suitable')),
  enabled boolean NOT NULL DEFAULT false,
  last_run_at timestamp with time zone,
  last_outcome text NOT NULL DEFAULT '',
  consecutive_failures integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sources TO anon;
GRANT SELECT ON public.sources TO authenticated;
GRANT ALL ON public.sources TO service_role;

ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

-- Attribution has to be visible to everyone; nobody but the platform writes.
CREATE POLICY "Sources are publicly readable" ON public.sources
  FOR SELECT USING (true);

CREATE TRIGGER sources_touch BEFORE UPDATE ON public.sources
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX sources_enabled_idx ON public.sources (enabled, status);
CREATE INDEX sources_place_ids_idx ON public.sources USING gin (place_ids);

-- One row per thing a source told us about. Many rows may resolve to the same
-- Living World activity, which is how two sources keep two attributions.
CREATE TABLE public.source_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  source_url text NOT NULL DEFAULT '',
  payload_hash text NOT NULL DEFAULT '',
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  source_state text NOT NULL DEFAULT 'live'
    CHECK (source_state IN ('live', 'cancelled', 'postponed', 'removed')),
  first_imported_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  source_updated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (source_id, external_id)
);

GRANT SELECT ON public.source_records TO anon;
GRANT SELECT ON public.source_records TO authenticated;
GRANT ALL ON public.source_records TO service_role;

ALTER TABLE public.source_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Source records are publicly readable" ON public.source_records
  FOR SELECT USING (true);

CREATE TRIGGER source_records_touch BEFORE UPDATE ON public.source_records
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX source_records_listing_idx ON public.source_records (listing_id);
CREATE INDEX source_records_source_state_idx ON public.source_records (source_id, source_state);

-- Real time, provenance and origin on the one canonical activity record.
ALTER TABLE public.listings
  ADD COLUMN starts_at timestamp with time zone,
  ADD COLUMN ends_at timestamp with time zone,
  ADD COLUMN timezone text NOT NULL DEFAULT '',
  ADD COLUMN recurrence text NOT NULL DEFAULT '',
  ADD COLUMN organiser text NOT NULL DEFAULT '',
  ADD COLUMN ticket_url text NOT NULL DEFAULT '',
  ADD COLUMN cancellation text NOT NULL DEFAULT ''
    CHECK (cancellation IN ('', 'cancelled', 'postponed')),
  ADD COLUMN imported_at timestamp with time zone,
  ADD COLUMN last_checked_at timestamp with time zone,
  ADD COLUMN origin text NOT NULL DEFAULT 'resident'
    CHECK (origin IN ('resident', 'source', 'confirmed'));

CREATE INDEX listings_starts_at_idx ON public.listings (starts_at);
CREATE INDEX listings_origin_idx ON public.listings (origin);