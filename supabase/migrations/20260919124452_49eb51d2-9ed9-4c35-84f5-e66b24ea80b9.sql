ALTER TABLE public.listings ALTER COLUMN creator_id DROP NOT NULL;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_owner_matches_origin CHECK (
    (origin = 'resident' AND creator_id IS NOT NULL)
    OR origin IN ('source', 'confirmed')
  );