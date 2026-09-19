ALTER TABLE public.opportunity_preferences
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'local_discovery'
  CHECK (visibility IN ('private', 'local_discovery', 'public'));

DROP POLICY IF EXISTS "Preferences of discoverable people are readable" ON public.opportunity_preferences;
CREATE POLICY "Visible preferences of discoverable people are readable"
  ON public.opportunity_preferences FOR SELECT TO anon, authenticated
  USING (
    visibility <> 'private'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = opportunity_preferences.user_id
        AND p.discoverable = true
    )
  );