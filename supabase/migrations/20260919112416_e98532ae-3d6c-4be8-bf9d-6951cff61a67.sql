-- Repeated place names must resolve through the hierarchy, never by name alone.
CREATE UNIQUE INDEX IF NOT EXISTS places_parent_name_key
  ON public.places (parent_id, lower(name))
  WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS places_country_idx ON public.places (country_code);
CREATE INDEX IF NOT EXISTS places_name_idx ON public.places (lower(name));

CREATE INDEX IF NOT EXISTS listings_place_status_band_idx
  ON public.listings (place_id, status, band);
CREATE INDEX IF NOT EXISTS listings_status_created_idx
  ON public.listings (status, created_at DESC);

-- Level 0: the world the app now opens on.
INSERT INTO public.places (parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb)
VALUES (NULL, 'region', 'United Kingdom & Ireland', 'uk-and-ireland', 'GB', 'Europe/London', 'GBP', 54.5, -4.0,
  'Two islands, five nations, thousands of localities. Choose somewhere and see what is actually there.')
ON CONFLICT (slug) DO NOTHING;

-- Level 1: countries.
INSERT INTO public.places (parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb)
SELECT p.id, v.kind, v.name, v.slug, v.cc, v.tz, v.cur, v.lat, v.lng, v.blurb
FROM (VALUES
  ('uk-and-ireland','country','United Kingdom','united-kingdom','GB','Europe/London','GBP',54.0,-2.5,'England, Scotland, Wales and Northern Ireland.'),
  ('uk-and-ireland','country','Ireland','ireland','IE','Europe/Dublin','EUR',53.4,-8.0,'The Republic of Ireland.')
) AS v(parent_slug,kind,name,slug,cc,tz,cur,lat,lng,blurb)
JOIN public.places p ON p.slug = v.parent_slug
ON CONFLICT (slug) DO NOTHING;

-- Level 2: the UK nations, and Irish provinces.
INSERT INTO public.places (parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb)
SELECT p.id, v.kind, v.name, v.slug, v.cc, v.tz, v.cur, v.lat, v.lng, v.blurb
FROM (VALUES
  ('united-kingdom','region','England','england','GB','Europe/London','GBP',52.5,-1.5,''),
  ('united-kingdom','region','Scotland','scotland','GB','Europe/London','GBP',56.8,-4.2,''),
  ('united-kingdom','region','Wales','wales','GB','Europe/London','GBP',52.3,-3.7,''),
  ('united-kingdom','region','Northern Ireland','northern-ireland','GB','Europe/London','GBP',54.7,-6.5,''),
  ('ireland','region','Leinster','leinster','IE','Europe/Dublin','EUR',53.3,-6.8,''),
  ('ireland','region','Munster','munster','IE','Europe/Dublin','EUR',52.3,-8.6,''),
  ('ireland','region','Connacht','connacht','IE','Europe/Dublin','EUR',53.6,-8.8,''),
  ('ireland','region','Ulster (Republic)','ulster-republic','IE','Europe/Dublin','EUR',54.6,-7.9,'')
) AS v(parent_slug,kind,name,slug,cc,tz,cur,lat,lng,blurb)
JOIN public.places p ON p.slug = v.parent_slug
ON CONFLICT (slug) DO NOTHING;

-- Level 3: counties and metropolitan areas.
INSERT INTO public.places (parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb)
SELECT p.id, 'area', v.name, v.slug, v.cc, v.tz, v.cur, v.lat, v.lng, v.blurb
FROM (VALUES
  ('england','West Midlands','west-midlands','GB','Europe/London','GBP',52.48,-1.90,''),
  ('england','West of England','west-of-england','GB','Europe/London','GBP',51.45,-2.58,''),
  ('england','Herefordshire','herefordshire','GB','Europe/London','GBP',52.08,-2.72,'A rural county of small market towns, orchards, hills and long distances between things.'),
  ('england','Shropshire','shropshire','GB','Europe/London','GBP',52.67,-2.70,''),
  ('england','Greater London','greater-london','GB','Europe/London','GBP',51.51,-0.13,''),
  ('england','Greater Manchester','greater-manchester','GB','Europe/London','GBP',53.48,-2.24,''),
  ('england','Merseyside','merseyside','GB','Europe/London','GBP',53.41,-2.98,''),
  ('england','West Yorkshire','west-yorkshire','GB','Europe/London','GBP',53.80,-1.55,''),
  ('england','South Yorkshire','south-yorkshire','GB','Europe/London','GBP',53.38,-1.47,''),
  ('england','Nottinghamshire','nottinghamshire','GB','Europe/London','GBP',53.00,-1.15,''),
  ('england','Leicestershire','leicestershire','GB','Europe/London','GBP',52.64,-1.13,''),
  ('england','Oxfordshire','oxfordshire','GB','Europe/London','GBP',51.75,-1.26,''),
  ('england','Cambridgeshire','cambridgeshire','GB','Europe/London','GBP',52.21,0.12,''),
  ('england','Tyne and Wear','tyne-and-wear','GB','Europe/London','GBP',54.98,-1.61,''),
  ('england','Cornwall','cornwall','GB','Europe/London','GBP',50.37,-4.84,''),
  ('scotland','City of Edinburgh','city-of-edinburgh','GB','Europe/London','GBP',55.95,-3.19,''),
  ('scotland','Glasgow City','glasgow-city','GB','Europe/London','GBP',55.86,-4.25,''),
  ('scotland','Highland','highland','GB','Europe/London','GBP',57.48,-4.22,''),
  ('scotland','Fife','fife','GB','Europe/London','GBP',56.21,-3.15,''),
  ('wales','Cardiff','cardiff-area','GB','Europe/London','GBP',51.48,-3.18,''),
  ('wales','Swansea','swansea-area','GB','Europe/London','GBP',51.62,-3.94,''),
  ('wales','Gwynedd','gwynedd','GB','Europe/London','GBP',52.93,-4.13,''),
  ('wales','Newport','newport-area','GB','Europe/London','GBP',51.58,-2.99,''),
  ('northern-ireland','Belfast','belfast-area','GB','Europe/London','GBP',54.60,-5.93,''),
  ('northern-ireland','Derry City and Strabane','derry-and-strabane','GB','Europe/London','GBP',54.99,-7.31,''),
  ('northern-ireland','Ards and North Down','ards-and-north-down','GB','Europe/London','GBP',54.65,-5.67,''),
  ('leinster','County Dublin','county-dublin','IE','Europe/Dublin','EUR',53.35,-6.26,''),
  ('leinster','County Wicklow','county-wicklow','IE','Europe/Dublin','EUR',52.98,-6.37,''),
  ('munster','County Cork','county-cork','IE','Europe/Dublin','EUR',51.90,-8.47,''),
  ('munster','County Kerry','county-kerry','IE','Europe/Dublin','EUR',52.15,-9.57,''),
  ('munster','County Clare','county-clare','IE','Europe/Dublin','EUR',52.85,-8.99,''),
  ('connacht','County Galway','county-galway','IE','Europe/Dublin','EUR',53.27,-9.05,''),
  ('ulster-republic','County Donegal','county-donegal','IE','Europe/Dublin','EUR',54.90,-8.00,'')
) AS v(parent_slug,name,slug,cc,tz,cur,lat,lng,blurb)
JOIN public.places p ON p.slug = v.parent_slug
ON CONFLICT (slug) DO NOTHING;

-- Level 4: cities and towns.
INSERT INTO public.places (parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb)
SELECT p.id, v.kind, v.name, v.slug, v.cc, v.tz, v.cur, v.lat, v.lng, v.blurb
FROM (VALUES
  ('west-midlands','city','Birmingham','birmingham','GB','Europe/London','GBP',52.4862,-1.8904,'A young, working, many-languaged city built on making things.'),
  ('west-midlands','city','Coventry','coventry','GB','Europe/London','GBP',52.4068,-1.5197,''),
  ('west-midlands','city','Wolverhampton','wolverhampton','GB','Europe/London','GBP',52.5870,-2.1288,''),
  ('west-of-england','city','Bristol','bristol','GB','Europe/London','GBP',51.4545,-2.5879,'A harbour city with a stubborn independent streak, and more going on than anyone can keep up with.'),
  ('west-of-england','city','Bath','bath','GB','Europe/London','GBP',51.3811,-2.3590,''),
  ('herefordshire','city','Hereford','hereford','GB','Europe/London','GBP',52.0567,-2.7160,'The county town: a cathedral, a river, and everything else spread out around it.'),
  ('herefordshire','town','Leominster','leominster','GB','Europe/London','GBP',52.2280,-2.7390,''),
  ('herefordshire','town','Ross-on-Wye','ross-on-wye','GB','Europe/London','GBP',51.9140,-2.5800,''),
  ('herefordshire','town','Ledbury','ledbury','GB','Europe/London','GBP',52.0350,-2.4230,''),
  ('herefordshire','town','Bromyard','bromyard','GB','Europe/London','GBP',52.1900,-2.5090,''),
  ('herefordshire','town','Kington','kington','GB','Europe/London','GBP',52.2040,-3.0290,''),
  ('shropshire','town','Newport, Shropshire','newport-shropshire','GB','Europe/London','GBP',52.7690,-2.3780,''),
  ('shropshire','town','Shrewsbury','shrewsbury','GB','Europe/London','GBP',52.7070,-2.7540,''),
  ('greater-london','city','London','london','GB','Europe/London','GBP',51.5072,-0.1276,''),
  ('greater-manchester','city','Manchester','manchester','GB','Europe/London','GBP',53.4808,-2.2426,''),
  ('greater-manchester','city','Salford','salford','GB','Europe/London','GBP',53.4875,-2.2901,''),
  ('merseyside','city','Liverpool','liverpool','GB','Europe/London','GBP',53.4084,-2.9916,''),
  ('west-yorkshire','city','Leeds','leeds','GB','Europe/London','GBP',53.8008,-1.5491,''),
  ('south-yorkshire','city','Sheffield','sheffield','GB','Europe/London','GBP',53.3811,-1.4701,''),
  ('nottinghamshire','city','Nottingham','nottingham','GB','Europe/London','GBP',52.9548,-1.1581,''),
  ('leicestershire','city','Leicester','leicester','GB','Europe/London','GBP',52.6369,-1.1398,''),
  ('oxfordshire','city','Oxford','oxford','GB','Europe/London','GBP',51.7520,-1.2577,''),
  ('cambridgeshire','city','Cambridge','cambridge','GB','Europe/London','GBP',52.2053,0.1218,''),
  ('tyne-and-wear','city','Newcastle upon Tyne','newcastle-upon-tyne','GB','Europe/London','GBP',54.9783,-1.6178,''),
  ('cornwall','town','Falmouth','falmouth','GB','Europe/London','GBP',50.1530,-5.0660,''),
  ('city-of-edinburgh','city','Edinburgh','edinburgh','GB','Europe/London','GBP',55.9533,-3.1883,''),
  ('glasgow-city','city','Glasgow','glasgow','GB','Europe/London','GBP',55.8642,-4.2518,''),
  ('highland','city','Inverness','inverness','GB','Europe/London','GBP',57.4778,-4.2247,''),
  ('fife','town','St Andrews','st-andrews','GB','Europe/London','GBP',56.3398,-2.7967,''),
  ('cardiff-area','city','Cardiff','cardiff','GB','Europe/London','GBP',51.4816,-3.1791,''),
  ('swansea-area','city','Swansea','swansea','GB','Europe/London','GBP',51.6214,-3.9436,''),
  ('gwynedd','city','Bangor','bangor-gwynedd','GB','Europe/London','GBP',53.2280,-4.1290,''),
  ('gwynedd','town','Caernarfon','caernarfon','GB','Europe/London','GBP',53.1400,-4.2700,''),
  ('newport-area','city','Newport','newport-wales','GB','Europe/London','GBP',51.5842,-2.9977,''),
  ('belfast-area','city','Belfast','belfast','GB','Europe/London','GBP',54.5973,-5.9301,''),
  ('derry-and-strabane','city','Derry','derry','GB','Europe/London','GBP',54.9966,-7.3086,''),
  ('ards-and-north-down','town','Bangor','bangor-county-down','GB','Europe/London','GBP',54.6570,-5.6690,''),
  ('county-dublin','city','Dublin','dublin','IE','Europe/Dublin','EUR',53.3498,-6.2603,''),
  ('county-wicklow','town','Bray','bray','IE','Europe/Dublin','EUR',53.2028,-6.0983,''),
  ('county-cork','city','Cork','cork','IE','Europe/Dublin','EUR',51.8985,-8.4756,''),
  ('county-kerry','town','Killarney','killarney','IE','Europe/Dublin','EUR',52.0599,-9.5044,''),
  ('county-clare','town','Ennis','ennis','IE','Europe/Dublin','EUR',52.8436,-8.9864,''),
  ('county-galway','city','Galway','galway','IE','Europe/Dublin','EUR',53.2707,-9.0568,''),
  ('county-donegal','town','Letterkenny','letterkenny','IE','Europe/Dublin','EUR',54.9503,-7.7343,'')
) AS v(parent_slug,kind,name,slug,cc,tz,cur,lat,lng,blurb)
JOIN public.places p ON p.slug = v.parent_slug
ON CONFLICT (slug) DO NOTHING;

-- Level 5: neighbourhoods and villages in the first trial localities.
INSERT INTO public.places (parent_id, kind, name, slug, country_code, timezone, currency, lat, lng, blurb)
SELECT p.id, v.kind, v.name, v.slug, 'GB', 'Europe/London', 'GBP', v.lat, v.lng, ''
FROM (VALUES
  ('birmingham','neighbourhood','Digbeth','digbeth',52.4760,-1.8840),
  ('birmingham','neighbourhood','Jewellery Quarter','jewellery-quarter',52.4880,-1.9100),
  ('birmingham','neighbourhood','Moseley','moseley',52.4440,-1.8830),
  ('birmingham','neighbourhood','Kings Heath','kings-heath',52.4310,-1.8930),
  ('birmingham','neighbourhood','Handsworth','handsworth',52.5090,-1.9350),
  ('birmingham','neighbourhood','Bournville','bournville',52.4290,-1.9350),
  ('birmingham','neighbourhood','Stirchley','stirchley',52.4340,-1.9120),
  ('bristol','neighbourhood','Stokes Croft','stokes-croft',51.4640,-2.5880),
  ('bristol','neighbourhood','Easton','easton-bristol',51.4640,-2.5620),
  ('bristol','neighbourhood','Bedminster','bedminster',51.4390,-2.5990),
  ('bristol','neighbourhood','Southville','southville',51.4430,-2.6070),
  ('bristol','neighbourhood','Clifton','clifton-bristol',51.4570,-2.6190),
  ('bristol','neighbourhood','St Werburghs','st-werburghs',51.4720,-2.5690),
  ('bristol','neighbourhood','Harbourside','harbourside',51.4490,-2.5990),
  ('herefordshire','village','Weobley','weobley',52.1580,-2.8740),
  ('herefordshire','village','Pembridge','pembridge',52.2170,-2.8920),
  ('herefordshire','village','Much Marcle','much-marcle',51.9880,-2.4930),
  ('herefordshire','village','Bishops Frome','bishops-frome',52.1350,-2.4680),
  ('herefordshire','village','Eardisley','eardisley',52.1360,-2.9750)
) AS v(parent_slug,kind,name,slug,lat,lng)
JOIN public.places p ON p.slug = v.parent_slug
ON CONFLICT (slug) DO NOTHING;