CREATE TABLE public.places (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id uuid REFERENCES public.places(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'city',
  name text NOT NULL,
  slug text NOT NULL,
  country_code text NOT NULL DEFAULT '',
  timezone text NOT NULL DEFAULT 'UTC',
  currency text NOT NULL DEFAULT 'EUR',
  lat numeric,
  lng numeric,
  blurb text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX places_slug_key ON public.places (slug);
CREATE INDEX places_parent_idx ON public.places (parent_id);
CREATE INDEX places_kind_idx ON public.places (kind);

GRANT SELECT ON public.places TO anon;
GRANT SELECT ON public.places TO authenticated;
GRANT ALL ON public.places TO service_role;

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Places are readable by anyone"
  ON public.places FOR SELECT
  USING (true);

CREATE TRIGGER places_touch
  BEFORE UPDATE ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.listings
  ADD COLUMN place_id uuid REFERENCES public.places(id) ON DELETE SET NULL,
  ADD COLUMN lat numeric,
  ADD COLUMN lng numeric;

ALTER TABLE public.profiles
  ADD COLUMN place_id uuid REFERENCES public.places(id) ON DELETE SET NULL;

ALTER TABLE public.hour_offers
  ADD COLUMN place_id uuid REFERENCES public.places(id) ON DELETE SET NULL;

CREATE INDEX listings_place_idx ON public.listings (place_id);
CREATE INDEX listings_discovery_idx ON public.listings (status, band, created_at DESC);
CREATE INDEX listings_creator_idx ON public.listings (creator_id);
CREATE INDEX hour_offers_open_idx ON public.hour_offers (status, created_at DESC);
CREATE INDEX hour_offers_place_idx ON public.hour_offers (place_id);
CREATE INDEX hour_offers_user_idx ON public.hour_offers (user_id);
CREATE INDEX profiles_place_idx ON public.profiles (place_id);

INSERT INTO public.places (kind, name, slug, country_code, timezone, currency, lat, lng, blurb)
VALUES ('country', 'Portugal', 'portugal', 'PT', 'Europe/Lisbon', 'EUR', 39.5, -8.0, '');

INSERT INTO public.places (parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb)
SELECT id, 'city', 'Lisbon', 'lisbon', 'PT', 'Europe/Lisbon', 'EUR', 38.7223, -9.1393,
       'Seven hills, a wide river, tiled walls and a lot of people making things.'
FROM public.places WHERE slug = 'portugal';