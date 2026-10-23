-- Scope per-fact local discovery to a verified locality relationship.
-- Stacked after 20261023100000_local_discovery_place_boundary.sql.
-- Global reads require explicit public visibility; local reads require a current
-- verified membership. Existing owner-read policies remain effective.
-- Do not apply to hosted projects until deployment identity and disposable tests
-- are independently confirmed.

DROP POLICY IF EXISTS "Visible capabilities of discoverable people are readable"
  ON public.person_capabilities;
DROP POLICY IF EXISTS "Public capabilities of discoverable people are readable"
  ON public.person_capabilities;
DROP POLICY IF EXISTS "Verified locality members can read local-discovery capabilities"
  ON public.person_capabilities;

CREATE POLICY "Public capabilities of discoverable people are readable"
  ON public.person_capabilities FOR SELECT TO anon, authenticated
  USING (
    visibility = 'public'
    AND (expires_on IS NULL OR expires_on >= CURRENT_DATE)
    AND last_confirmed_at > now() - interval '30 days'
    AND EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = person_capabilities.user_id
        AND profile.discoverable = true
    )
  );

CREATE POLICY "Verified locality members can read local-discovery capabilities"
  ON public.person_capabilities FOR SELECT TO authenticated
  USING (
    visibility = 'local_discovery'
    AND (expires_on IS NULL OR expires_on >= CURRENT_DATE)
    AND last_confirmed_at > now() - interval '30 days'
    AND EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = person_capabilities.user_id
        AND profile.discoverable = true
        AND private.is_verified_locality_member(profile.place_id)
    )
  );

-- Service areas scope to the place served, not the owner's profile place.
DROP POLICY IF EXISTS "Visible service areas of discoverable people are readable"
  ON public.service_areas;
DROP POLICY IF EXISTS "Public service areas of discoverable people are readable"
  ON public.service_areas;
DROP POLICY IF EXISTS "Verified locality members can read local-discovery service areas"
  ON public.service_areas;

CREATE POLICY "Public service areas of discoverable people are readable"
  ON public.service_areas FOR SELECT TO anon, authenticated
  USING (
    visibility = 'public'
    AND EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = service_areas.user_id
        AND profile.discoverable = true
    )
  );

CREATE POLICY "Verified locality members can read local-discovery service areas"
  ON public.service_areas FOR SELECT TO authenticated
  USING (
    visibility = 'local_discovery'
    AND private.is_verified_locality_member(place_id)
    AND EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = service_areas.user_id
        AND profile.discoverable = true
    )
  );

-- Availability requires a current, non-expired time window and recent confirmation.
DROP POLICY IF EXISTS "Visible current availability of discoverable people is readable"
  ON public.availability_windows;
DROP POLICY IF EXISTS "Public availability of discoverable people is readable"
  ON public.availability_windows;
DROP POLICY IF EXISTS "Verified locality members can read local-discovery availability"
  ON public.availability_windows;

CREATE POLICY "Public availability of discoverable people is readable"
  ON public.availability_windows FOR SELECT TO anon, authenticated
  USING (
    visibility = 'public'
    AND (expires_at IS NULL OR expires_at >= now())
    AND ends_at > now()
    AND last_confirmed_at > now() - interval '30 days'
    AND EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = availability_windows.user_id
        AND profile.discoverable = true
    )
  );

CREATE POLICY "Verified locality members can read local-discovery availability"
  ON public.availability_windows FOR SELECT TO authenticated
  USING (
    visibility = 'local_discovery'
    AND (expires_at IS NULL OR expires_at >= now())
    AND ends_at > now()
    AND last_confirmed_at > now() - interval '30 days'
    AND EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = availability_windows.user_id
        AND profile.discoverable = true
        AND private.is_verified_locality_member(profile.place_id)
    )
  );

DROP POLICY IF EXISTS "Visible preferences of discoverable people are readable"
  ON public.opportunity_preferences;
DROP POLICY IF EXISTS "Public opportunity preferences of discoverable people are readable"
  ON public.opportunity_preferences;
DROP POLICY IF EXISTS "Verified locality members can read local-discovery opportunity preferences"
  ON public.opportunity_preferences;

CREATE POLICY "Public opportunity preferences of discoverable people are readable"
  ON public.opportunity_preferences FOR SELECT TO anon, authenticated
  USING (
    visibility = 'public'
    AND EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = opportunity_preferences.user_id
        AND profile.discoverable = true
    )
  );

CREATE POLICY "Verified locality members can read local-discovery opportunity preferences"
  ON public.opportunity_preferences FOR SELECT TO authenticated
  USING (
    visibility = 'local_discovery'
    AND EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = opportunity_preferences.user_id
        AND profile.discoverable = true
        AND private.is_verified_locality_member(profile.place_id)
    )
  );

DROP POLICY IF EXISTS "Contributions of discoverable people are readable"
  ON public.contribution_preferences;
DROP POLICY IF EXISTS "Public contributions of discoverable people are readable"
  ON public.contribution_preferences;
DROP POLICY IF EXISTS "Verified locality members can read local-discovery contributions"
  ON public.contribution_preferences;

CREATE POLICY "Public contributions of discoverable people are readable"
  ON public.contribution_preferences FOR SELECT TO anon, authenticated
  USING (
    visibility = 'public'
    AND EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = contribution_preferences.user_id
        AND profile.discoverable = true
    )
  );

CREATE POLICY "Verified locality members can read local-discovery contributions"
  ON public.contribution_preferences FOR SELECT TO authenticated
  USING (
    visibility = 'local_discovery'
    AND EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.id = contribution_preferences.user_id
        AND profile.discoverable = true
        AND private.is_verified_locality_member(profile.place_id)
    )
  );
