-- Capabilities: separate details per kind, freshness, and per-fact visibility.
ALTER TABLE public.person_capabilities
  ADD COLUMN IF NOT EXISTS issuing_body text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS obtained_on date,
  ADD COLUMN IF NOT EXISTS expires_on date,
  ADD COLUMN IF NOT EXISTS organisation text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS years_experience numeric,
  ADD COLUMN IF NOT EXISTS started_on date,
  ADD COLUMN IF NOT EXISTS ended_on date,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'local_discovery',
  ADD COLUMN IF NOT EXISTS last_confirmed_at timestamptz NOT NULL DEFAULT now();

-- Availability: volatile by nature, so it can expire and be hidden.
ALTER TABLE public.availability_windows
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'local_discovery',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_confirmed_at timestamptz NOT NULL DEFAULT now();

-- Service areas: serving an area is not living in it, and is not passing through.
ALTER TABLE public.service_areas
  ADD COLUMN IF NOT EXISTS relation text NOT NULL DEFAULT 'serves',
  ADD COLUMN IF NOT EXISTS travel_willingness text NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'local_discovery';

-- What someone is willing to give, and whether they want paying.
ALTER TABLE public.opportunity_preferences
  ADD COLUMN IF NOT EXISTS earning_preference text NOT NULL DEFAULT 'unstated';

CREATE TABLE IF NOT EXISTS public.contribution_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contribution text NOT NULL,
  note text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'local_discovery',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, contribution)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contribution_preferences TO authenticated;
GRANT SELECT ON public.contribution_preferences TO anon;
GRANT ALL ON public.contribution_preferences TO service_role;

ALTER TABLE public.contribution_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "People can manage what they give"
  ON public.contribution_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "People can read what they give"
  ON public.contribution_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Contributions of discoverable people are readable"
  ON public.contribution_preferences FOR SELECT
  USING (
    visibility <> 'private'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = contribution_preferences.user_id AND p.discoverable = true
    )
  );

CREATE TRIGGER touch_contribution_preferences
  BEFORE UPDATE ON public.contribution_preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Needs: roles are not skills, and a number is not a payment meaning.
ALTER TABLE public.needs
  ADD COLUMN IF NOT EXISTS required_roles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payment_model text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS budget_max numeric,
  ADD COLUMN IF NOT EXISTS last_confirmed_at timestamptz NOT NULL DEFAULT now();

-- Discovery paths: label, place, visibility, freshness, status.
CREATE INDEX IF NOT EXISTS person_capabilities_label_idx
  ON public.person_capabilities (lower(label));
CREATE INDEX IF NOT EXISTS person_capabilities_kind_idx
  ON public.person_capabilities (kind, visibility);
CREATE INDEX IF NOT EXISTS person_capabilities_fresh_idx
  ON public.person_capabilities (last_confirmed_at DESC);
CREATE INDEX IF NOT EXISTS availability_windows_window_idx
  ON public.availability_windows (starts_at, ends_at);
CREATE INDEX IF NOT EXISTS availability_windows_expiry_idx
  ON public.availability_windows (expires_at);
CREATE INDEX IF NOT EXISTS service_areas_place_relation_idx
  ON public.service_areas (place_id, relation);
CREATE INDEX IF NOT EXISTS opportunity_preferences_pref_idx
  ON public.opportunity_preferences (preference);
CREATE INDEX IF NOT EXISTS contribution_preferences_contribution_idx
  ON public.contribution_preferences (contribution);
CREATE INDEX IF NOT EXISTS needs_discovery_idx
  ON public.needs (status, visibility, place_id);
CREATE INDEX IF NOT EXISTS needs_fresh_idx
  ON public.needs (updated_at DESC);

-- Existing capability rows keep their meaning: they were stated, not checked.
UPDATE public.person_capabilities
  SET visibility = 'local_discovery'
  WHERE visibility IS NULL OR visibility = '';