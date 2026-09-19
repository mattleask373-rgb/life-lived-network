
CREATE TABLE public.needs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  intent TEXT NOT NULL DEFAULT 'paid_work',
  place_id UUID REFERENCES public.places(id),
  place_text TEXT NOT NULL DEFAULT '',
  lat NUMERIC,
  lng NUMERIC,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  flexibility TEXT NOT NULL DEFAULT 'some',
  budget NUMERIC,
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_type TEXT NOT NULL DEFAULT 'paid',
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  required_qualifications TEXT[] NOT NULL DEFAULT '{}',
  preferred_experience TEXT NOT NULL DEFAULT '',
  recurring BOOLEAN NOT NULL DEFAULT false,
  urgency TEXT NOT NULL DEFAULT 'soon',
  contact_preference TEXT NOT NULL DEFAULT 'in_app',
  visibility TEXT NOT NULL DEFAULT 'local_discovery',
  status TEXT NOT NULL DEFAULT 'open',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.needs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.needs TO authenticated;
GRANT ALL ON public.needs TO service_role;

ALTER TABLE public.needs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public needs are readable by anyone"
  ON public.needs FOR SELECT
  USING (visibility IN ('public', 'local_discovery') AND status = 'open');

CREATE POLICY "People can read their own needs"
  ON public.needs FOR SELECT TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "People can create their own needs"
  ON public.needs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "People can update their own needs"
  ON public.needs FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "People can delete their own needs"
  ON public.needs FOR DELETE TO authenticated
  USING (auth.uid() = creator_id);

CREATE INDEX idx_needs_place ON public.needs (place_id);
CREATE INDEX idx_needs_discovery ON public.needs (status, visibility, starts_at);
CREATE INDEX idx_needs_creator ON public.needs (creator_id, created_at DESC);
CREATE INDEX idx_needs_updated ON public.needs (updated_at DESC);
CREATE INDEX idx_needs_category ON public.needs (category);

CREATE TRIGGER update_needs_updated_at
  BEFORE UPDATE ON public.needs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.person_capabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'unstated',
  evidence TEXT NOT NULL DEFAULT '',
  verification TEXT NOT NULL DEFAULT 'unverified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.person_capabilities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.person_capabilities TO authenticated;
GRANT ALL ON public.person_capabilities TO service_role;

ALTER TABLE public.person_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Capabilities of discoverable people are readable"
  ON public.person_capabilities FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = person_capabilities.user_id AND p.discoverable = true));

CREATE POLICY "People can read their own capabilities"
  ON public.person_capabilities FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "People can manage their own capabilities"
  ON public.person_capabilities FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_capabilities_user ON public.person_capabilities (user_id);
CREATE INDEX idx_capabilities_label ON public.person_capabilities (kind, label);

CREATE TRIGGER update_person_capabilities_updated_at
  BEFORE UPDATE ON public.person_capabilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.service_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  place_id UUID NOT NULL REFERENCES public.places(id),
  radius_km INTEGER NOT NULL DEFAULT 10,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.service_areas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_areas TO authenticated;
GRANT ALL ON public.service_areas TO service_role;

ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service areas of discoverable people are readable"
  ON public.service_areas FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = service_areas.user_id AND p.discoverable = true));

CREATE POLICY "People can read their own service areas"
  ON public.service_areas FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "People can manage their own service areas"
  ON public.service_areas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_service_areas_user ON public.service_areas (user_id);
CREATE INDEX idx_service_areas_place ON public.service_areas (place_id);

CREATE TRIGGER update_service_areas_updated_at
  BEFORE UPDATE ON public.service_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.availability_windows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  recurrence TEXT NOT NULL DEFAULT 'none',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.availability_windows TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_windows TO authenticated;
GRANT ALL ON public.availability_windows TO service_role;

ALTER TABLE public.availability_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability of discoverable people is readable"
  ON public.availability_windows FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = availability_windows.user_id AND p.discoverable = true));

CREATE POLICY "People can read their own availability"
  ON public.availability_windows FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "People can manage their own availability"
  ON public.availability_windows FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_availability_user ON public.availability_windows (user_id);
CREATE INDEX idx_availability_time ON public.availability_windows (starts_at, ends_at);

CREATE TRIGGER update_availability_windows_updated_at
  BEFORE UPDATE ON public.availability_windows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.opportunity_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  preference TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, preference)
);

GRANT SELECT ON public.opportunity_preferences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunity_preferences TO authenticated;
GRANT ALL ON public.opportunity_preferences TO service_role;

ALTER TABLE public.opportunity_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preferences of discoverable people are readable"
  ON public.opportunity_preferences FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = opportunity_preferences.user_id AND p.discoverable = true));

CREATE POLICY "People can read their own preferences"
  ON public.opportunity_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "People can manage their own preferences"
  ON public.opportunity_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_preferences_user ON public.opportunity_preferences (user_id);
CREATE INDEX idx_preferences_kind ON public.opportunity_preferences (preference);

CREATE TRIGGER update_opportunity_preferences_updated_at
  BEFORE UPDATE ON public.opportunity_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
