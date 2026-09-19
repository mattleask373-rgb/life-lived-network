INSERT INTO public.sources (
  name, kind, access_method, homepage_url, terms_url, attribution,
  store_images, refresh_minutes, place_ids, status, enabled
)
SELECT
  'Ticketmaster Discovery', 'platform', 'api',
  'https://developer.ticketmaster.com/',
  'https://developer.ticketmaster.com/support/terms-of-use/',
  'Ticketmaster',
  false, 720, '{}'::uuid[], 'requires_credentials', false
WHERE NOT EXISTS (SELECT 1 FROM public.sources WHERE name = 'Ticketmaster Discovery');