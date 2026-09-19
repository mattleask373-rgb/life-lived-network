CREATE TABLE public.journeys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text NOT NULL DEFAULT 'UTC',
  visibility text NOT NULL DEFAULT 'private',
  opportunity_opt_in boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  last_confirmed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT journeys_visibility_check CHECK (visibility IN ('private', 'friends', 'journey_network', 'public')),
  CONSTRAINT journeys_status_check CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  CONSTRAINT journeys_time_order_check CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at >= starts_at)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journeys TO authenticated;
GRANT SELECT ON public.journeys TO anon;
GRANT ALL ON public.journeys TO service_role;

ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "People can read their own journeys"
  ON public.journeys FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);
CREATE POLICY "People can create their own journeys"
  ON public.journeys FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "People can update their own journeys"
  ON public.journeys FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "People can delete their own journeys"
  ON public.journeys FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);
CREATE POLICY "Opted in public journeys are discoverable"
  ON public.journeys FOR SELECT TO anon, authenticated
  USING (
    visibility = 'public'
    AND opportunity_opt_in = true
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at >= now())
  );

CREATE TRIGGER journeys_touch
  BEFORE UPDATE ON public.journeys
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX journeys_owner_idx ON public.journeys (owner_id, created_at DESC);
CREATE INDEX journeys_discovery_idx ON public.journeys (visibility, opportunity_opt_in, status, starts_at, ends_at);
CREATE INDEX journeys_expiry_idx ON public.journeys (expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE public.journey_places (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE RESTRICT,
  position integer NOT NULL DEFAULT 0,
  arrives_at timestamptz,
  departs_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT journey_places_position_check CHECK (position >= 0),
  CONSTRAINT journey_places_time_order_check CHECK (arrives_at IS NULL OR departs_at IS NULL OR departs_at >= arrives_at),
  CONSTRAINT journey_places_unique_position UNIQUE (journey_id, position)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_places TO authenticated;
GRANT SELECT ON public.journey_places TO anon;
GRANT ALL ON public.journey_places TO service_role;

ALTER TABLE public.journey_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "People can read places on their own journeys"
  ON public.journey_places FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.journeys j
    WHERE j.id = journey_id AND j.owner_id = auth.uid()
  ));
CREATE POLICY "People can add places to their own journeys"
  ON public.journey_places FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.journeys j
    WHERE j.id = journey_id AND j.owner_id = auth.uid()
  ));
CREATE POLICY "People can update places on their own journeys"
  ON public.journey_places FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.journeys j
    WHERE j.id = journey_id AND j.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.journeys j
    WHERE j.id = journey_id AND j.owner_id = auth.uid()
  ));
CREATE POLICY "People can remove places from their own journeys"
  ON public.journey_places FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.journeys j
    WHERE j.id = journey_id AND j.owner_id = auth.uid()
  ));
CREATE POLICY "Places on opted in public journeys are discoverable"
  ON public.journey_places FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.journeys j
    WHERE j.id = journey_id
      AND j.visibility = 'public'
      AND j.opportunity_opt_in = true
      AND j.status = 'active'
      AND (j.expires_at IS NULL OR j.expires_at >= now())
  ));

CREATE TRIGGER journey_places_touch
  BEFORE UPDATE ON public.journey_places
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX journey_places_journey_idx ON public.journey_places (journey_id, position);
CREATE INDEX journey_places_discovery_idx ON public.journey_places (place_id, arrives_at, departs_at);
CREATE INDEX needs_required_skills_gin_idx ON public.needs USING gin (required_skills);
CREATE INDEX needs_required_roles_gin_idx ON public.needs USING gin (required_roles);