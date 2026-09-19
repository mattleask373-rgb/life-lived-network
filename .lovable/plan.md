# SEO + local discovery + lead generation — audit and plan

Audit only. Nothing was implemented.

## A. Current SEO state

- Every page is one client-rendered app shell. `src/routes/__root.tsx` sets a
  single site-wide title, description and og tags. No page sets a canonical URL.
- Per-page titles exist on most routes; private routes (`/auth`, `/profile`,
  `/conversations`, `/need`, `/help`, `/moderation`, `/sources`) correctly say
  `noindex`.
- `public/robots.txt` allows everything and names no sitemap. There is no
  sitemap, no structured data of any kind, no breadcrumbs, no prerendering.
- No public URL contains a locality or a service. The only way to reach
  Kings Heath is to pick it in the app and have it stored locally — invisible to
  a search engine and unshareable as a link.

Conclusion: the product is currently almost entirely undiscoverable by search.
Nothing needs rebuilding; a public, addressable surface needs adding on top.

## B. Current public routes

Indexable in principle: `/` (map/home), `/journey`, `/road-trip`, `/life-list`,
`/give`, `/make`. All are app screens, none are locality- or service-addressed.

## C. Current local entity model (reuse as-is)

- `places`: one hierarchy, data-driven, 221 rows, kinds country → region → area
  → city → town → village → neighbourhood, slugs, approximate coordinates,
  timezone, currency. Ireland separate, Portugal preserved. `src/lib/places.ts`
  has ancestors, descendants, containment, bounded search.
- `WorldEntry` is the single canonical thing on the map: layer, place, time,
  cost, provenance, freshness, source, demonstration flag, cancellation.
- People: capabilities with `kind = role | skill | qualification | experience`,
  level, verification state, visibility (`private | local_discovery | public`),
  freshness; service areas with relation and travel willingness; availability
  windows; contribution and earning preferences.
- Needs, possibility/supply engine, connection requests, moderation, ingest
  source registry, journeys, map viewport — all present and generic.

## D. Service model

`src/lib/services.ts` already treats a clinic practice, a class, a callout and a
community workshop as the same canonical activity with an organisation attached
and a truthful booking state (`bookable | enquire | external | not_bookable`),
plus provider note, qualification note and booking URL. The Guildhall is data,
not code — so the same model already covers osteopath, gardener, photographer.

What is missing is a **category**: nothing in the data says "sports massage" in a
way two records can share. Layers (`experience`, `work`, `people`…) are too
coarse; free-text titles cannot be grouped.

## E. SEO gaps

1. No public locality URLs and no service+locality URLs.
2. No service taxonomy, so no page can be "Osteopaths in Kings Heath".
3. No canonical tags, sitemap, structured data or breadcrumbs.
4. No server-rendered content for crawlers on any discovery page.
5. No enquiry/lead model — the only contact path is the private Need→connection
   flow, which requires an account.
6. No indexability gate, so any page engine would risk thin pages.

## F. URL architecture (one hierarchy, no competing patterns)

Derive paths from the existing place hierarchy, not a new one:

```text
/uk/birmingham                     locality front door
/uk/kings-heath                    same, any depth, slug is already unique
/uk/kings-heath/sports-massage     service + locality
/uk/birmingham/events              time-based locality view
/provider/<slug>                   provider / organisation profile
```

Two routes carry it: `$country.$place.tsx` and `$country.$place.$service.tsx`,
both fully generic. Country segment comes from `countryOf()`. Slugs already
unique, so repeated names (three Newports) resolve correctly. Redirect
non-canonical variants to the canonical path; strip query/tracking params from
the canonical tag.

## G. Provider profiles

No new provider table. A provider is either an organisation on canonical
activities, or a person whose capabilities are `visibility = public`. A profile
page shows only what is published: services, service area, availability where
published, qualifications with their verification state, experience as declared,
provenance, freshness, enquiry or external booking. Never an exact home address,
never a private person, never an inferred qualification.

## H. Lead generation (lightweight)

One generic table `enquiries`: requester (account or just an email with explicit
consent), provider, subject activity, service category, place, requested time,
free-text context, `intent` (`service | booking | callback | quote | availability
| information`), status, source page, provenance, timestamps. RLS: requester and
provider only. No CRM, no payments, no automation, no contacting several
providers at once. Nothing is sent for demonstration records — it says so.

## I. Indexability gate (explainable, not a score)

A pure function returns one of `INDEXABLE`, `INDEXABLE_WITH_LIMITATIONS`,
`NOINDEX`, `NOT_PUBLISHED`, plus the list of reasons. Requirements: real place,
real service category, at least a threshold of genuinely published providers or
activities, current (not stale/expired) information, provenance present, real
internal links, no policy block. Demonstration-only pages are never indexable.
Quiet pages exist for humans, saying plainly that nothing is listed yet.

## J. Structured data

Only what the page visibly shows: `BreadcrumbList` on locality/service/provider
pages, most specific `LocalBusiness` subtype (else `LocalBusiness` or
`Organization`) on provider pages with real address/geo/hours/phone/URL only,
`Event` on real dated events, `WebSite` on the home page. No review, rating or
aggregate data — we have none and will not invent it.

## K. Sitemaps, canonical, robots

Server routes under `src/routes/api/public/`: a sitemap index plus separate
locality, service, provider and event sitemaps, each bounded and paged, built
from the indexability gate so only `INDEXABLE` URLs appear. `robots.txt` gains
the sitemap line and keeps private routes out. Every public page emits a
canonical absolute URL.

## L. Performance

Public pages render their content server-side through existing loaders and
bounded reads, with the heavy map and interactive layers loaded after. Images
lazy and sized. Cache locality/service page data behind the server boundary.

## M. Internal linking

Service page → its locality, parent localities, sibling services, nearby
localities, providers, dated events, the map. Locality page → its services,
events, community offers, needs, journeys, children and parent. Real anchors,
crawlable, no hidden link farms.

## N. Analytics

Aggregate, privacy-safe counters only: organic landing by locality and service,
provider page views, enquiry started/submitted, external booking click, map
interaction, journey started. No per-person behaviour, nothing public.

## O. Commercial foundation

Enquiries are the first commercial artefact. Business claim (verify ownership,
then edit own data with provenance recorded) is designed for but not built.
Promoted placement, if ever added, is labelled and never alters factual claims
or hides alternatives.

## P. Scaling

Kings Heath → Birmingham → West Midlands → UK → Ireland → international needs no
code change: place rows and service categories are data, and the gate decides
what deserves a page. No city-specific or service-specific code, ever.

## Q. Implementation slices

1. **SEO technical foundation** — canonical tags, per-page metadata discipline,
   robots + sitemap plumbing, server-rendered public shell, site URL helper.
2. **Service taxonomy + locality landing pages** — generic category model
   attached to existing activities and capabilities; `/uk/<place>` pages from the
   existing locality sections; quiet states.
3. **Service + locality pages** — `/uk/<place>/<service>` with the indexability
   gate, breadcrumbs, internal links, map entry.
4. **Provider profiles** — organisation and public-person pages.
5. **Structured data + sitemaps + indexing** — schema per page type, bounded
   sitemaps from the gate, Search Console submission.
6. **Enquiry pathway** — `enquiries` table, RLS, forms, provider inbox.
7. **Cross-navigation + analytics + commercial foundation** — full discovery
   graph, aggregate metrics, claim-a-profile groundwork.

Each slice: build → test → review before the next.

## Not in scope of any slice above

Payments, CRM, booking platform, ratings, reviews, AI-written local content,
paid placement mechanics, international expansion beyond the existing data.

SEO + LOCAL DISCOVERY ARCHITECTURE AUDITED.

LOCALITY + SERVICE GROWTH MODEL READY.

LEAD-GENERATION FOUNDATION DEFINED.

INDEXABILITY / QUALITY GATES DEFINED.

IMPLEMENTATION SLICES READY.

NO IMPLEMENTATION PERFORMED.
