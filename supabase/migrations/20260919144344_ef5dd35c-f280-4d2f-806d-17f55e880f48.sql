REVOKE SELECT ON public.sources FROM anon, authenticated;
REVOKE SELECT ON public.source_records FROM anon, authenticated;
GRANT SELECT ON public.sources TO service_role;
GRANT SELECT ON public.source_records TO service_role;

DROP POLICY IF EXISTS "Sources are publicly readable" ON public.sources;
DROP POLICY IF EXISTS "Source records are publicly readable" ON public.source_records;

CREATE OR REPLACE FUNCTION public.get_listing_provenance(_listing_ids uuid[])
RETURNS TABLE (
  listing_id uuid,
  source_name text,
  source_url text,
  source_state text,
  last_seen_at timestamptz,
  source_updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sr.listing_id,
    COALESCE(NULLIF(s.attribution, ''), s.name) AS source_name,
    sr.source_url,
    sr.source_state,
    sr.last_seen_at,
    sr.source_updated_at
  FROM public.source_records sr
  JOIN public.sources s ON s.id = sr.source_id
  JOIN public.listings l ON l.id = sr.listing_id
  WHERE sr.listing_id = ANY(_listing_ids)
    AND l.status = 'published'
  ORDER BY sr.last_seen_at DESC
  LIMIT 200;
$$;
REVOKE ALL ON FUNCTION public.get_listing_provenance(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_listing_provenance(uuid[]) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Profile photos are viewable" ON storage.objects;
CREATE POLICY "Owners and discoverable people have viewable profile photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'profile-photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.discoverable = true
    )
  )
);