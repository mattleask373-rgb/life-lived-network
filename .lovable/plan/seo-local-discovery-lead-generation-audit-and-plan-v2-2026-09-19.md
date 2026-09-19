# SEO + local discovery + lead generation — audit and plan (v2)

Audit only. Nothing implemented in this pass. Slice 1 of the previous, approved
version of this plan is already built; that is reflected below.

## A. Current SEO state

- `src/lib/seo.ts` (built, slice 1) is the single place deciding what a page tells
  a search engine: canonical address with tracking parameters and fragments
  stripped, public vs private metadata, sitemap builders. Tested.
- Six public screens (`/`, `/journey`, `/road-trip`, `/life-list`, `/give`,
  `/make`) carry titles, descriptions, og tags and a canonical URL.
- Private and internal screens (`/auth`, `/profile`, `/conversations`, `/need`,
  `/need/$id`, `/help`, `/moderation`, `/sources`) say `noindex, nofollow` and are
  disallowed in `robots.txt`.
- `robots.txt` names the sitemap. `/api/public/sitemap.xml` is an index pointing
  at `/api/public/sitemap-pages.xml`.
- Site origin comes from `VITE_SITE_ORIGIN`, else the published Lovable address.
- Still absent: any locality or service URL, any service taxonomy, any structured
  data, any breadcrumbs, any enquiry pathway, any indexability gate.

## B. Current public routes

`/` (map/home), `/journey`, `/road-trip`, `/life-list`, `/give`, `/make`. All are
app screens; none is addressed by locality or service, so no search for
"osteopath Kings Heath" can land anywhere useful yet.

## C. Current local entity model (reuse unchanged)

- `places`: one data-driven hierarchy, 221 rows, kinds country → region → area →
  city → town → village → neighbourhood, unique slugs, approximate coordinates,
  timezone, currency. Ireland is a separate branch; Portugal preserved and
  non-default. `src/lib/places.ts`: ancestors, descendants, containment, bounded
  search, all location-neutral.
- `WorldEntry` is the single canonical thing: layer, place, time, cost, source,
  provenance, freshness, demonstration flag, cancellation.
- People: capabilities with `kind = role | skill | qualification | experience`,
  level, verification state, visibility (`private | local_discovery | public`),
  freshness; service areas with relation and travel willingness; availability
  windows; contribution and earning preferences.
- Needs, supply/possibility engine, connection requests, moderation with reviewer
  roles, ingest source registry, journeys, interactive map — all generic.

## D. Service / capability model

`src/lib/services.ts` already treats a clinic practice, a studio class, a
tradesperson's callout and a community workshop as the same canonical activity
with an organisation attached and a truthful booking state (`bookable | enquire |
external | not_bookable`), plus provider note, qualification note and booking URL.
The Guildhall is data, not code.

Missing: a shared **category**. Nothing says "sports massage" in a way two
records can share — layers are too coarse and free-text titles cannot be grouped.
This single gap is what blocks every service+locality page.

## E. SEO gaps

1. No locality URLs and no service+locality URLs.
2. No service taxonomy.
3. No structured data, no breadcrumbs.
4. No enquiry/lead model (only the private, account-only Need→connection flow).
5. No indexability gate, so a page engine would risk thin pages.
6. Public pages not yet content-rendered server-side for crawlers.

## F. Locality + service URL architecture

One hierarchy, derived from the existing place rows — no competing patterns:

```text
/uk/birmingham                     locality front door
/uk/kings-heath                    same shape at any depth; slugs are unique
/uk/kings-heath/sports-massage     service + locality
/uk/birmingham/events              time-based locality view
/provider/<slug>                   provider or organisation profile
```

Two generic routes: `$country.$place.tsx`, `$country.$place.$service.tsx`.
Country segment from `countryOf()`. Alternate forms redirect to the canonical
path; query and tracking parameters never appear in the canonical tag. Optional
qualifiers ("female yoga instructor Birmingham") are filters on the service page,
never separate URLs.

## G. Provider profile architecture

No new provider table. A provider is an organisation on canonical activities, or a
person whose capabilities are `visibility = public`. The page shows only what is
published: services, service area, availability where published, qualifications
with verification state, experience as declared, photos where permitted,
provenance, freshness, enquiry or external booking. Never a private person, never
an exact home address, never a qualification inferred from a skill.

## H. Lead-generation architecture

One generic `enquiries` table: requester (account, or email with explicit
consent), provider, subject activity, service category, place, requested time,
context, `intent` (`service | booking | callback | quote | availability |
information | connection`), status, source page, provenance, timestamps. RLS
limits rows to requester and provider. One provider per action, chosen by the
person. No CRM, no automation, no payments. Demonstration records send nothing and
say so.

## I. Page quality / indexability gate

A pure, explainable function returning `INDEXABLE`,
`INDEXABLE_WITH_LIMITATIONS`, `NOINDEX` or `NOT_PUBLISHED`, plus the reasons.
Dimensions: valid place, valid category, count of genuinely published providers or
activities, information completeness, freshness (nothing stale or expired),
provenance present, real internal links, policy status. Demonstration-only pages
are never indexable and never enter a sitemap. Quiet pages still exist for people,
saying plainly that nothing is listed here yet. No score, no ranking.

## J. Structured data plan

Only what the page visibly shows: `BreadcrumbList` on locality, service and
provider pages; most specific `LocalBusiness` subtype (else `LocalBusiness` or
`Organization`) on provider pages, with real address, geo, hours, telephone and
URL only when published; `Event` on genuinely dated events; `WebSite` on home. No
review, rating or aggregate markup — we have none and will not invent any.

## K. Sitemap / canonical / robots plan

Extend the existing index with bounded, paged locality, service, provider and
event sitemaps, each fed by the gate so only `INDEXABLE` URLs appear. Canonical on
every public page (built). Robots keeps private screens out (built) and nothing
intended for search is behind robots, noindex or a login.

## L. Performance plan

Locality and service pages render their content through server loaders and the
existing bounded reads, with the map and interactive layers loaded afterwards.
Lazy, sized images. Cached page data behind the server boundary. A basic service
page must not pull in the whole application.

## M. Internal linking plan

Service page → its locality, ancestors, sibling services, nearby localities,
providers, dated events, the map. Locality page → its services, events, community
offers, needs, journeys, children and parent. Provider page → services, locality,
related services. Ordinary crawlable anchors only.

## N. Analytics plan

Aggregate, privacy-safe counters: organic landing by locality and service,
provider page view, map interaction, enquiry started, enquiry submitted, external
booking click, journey started, event opened. No per-person behaviour, nothing
public, no surveillance.

## O. Commercial model foundation

Enquiries first. Then business claim: verify ownership, edit own data with
provenance recorded. Promoted placement, if ever introduced, is labelled, never
alters factual claims, never hides alternatives, never buys trust. Community
discovery sits alongside commercial providers on every page.

## P. Mass-market scaling model

Kings Heath → Birmingham → West Midlands → UK → Ireland → international requires
no code change: places and categories are data, the gate decides which pages
deserve to exist. No city-specific and no service-specific code, ever.

## Q. Implementation slices

1. **SEO technical foundation** — DONE (canonical, public/private metadata,
   robots, sitemap index).
2. **Service taxonomy + locality landing pages** — generic category model attached
   to existing activities and capabilities; `/uk/<place>` built from the existing
   locality sections; quiet states.
3. **Service + locality pages** — `/uk/<place>/<service>` with the indexability
   gate, breadcrumbs, internal links, map entry.
4. **Provider profiles** — organisation and public-person pages.
5. **Structured data + sitemaps + indexing** — schema per page type, bounded
   sitemaps from the gate, Search Console submission.
6. **Enquiry pathway** — `enquiries` table, RLS, forms, provider inbox.
7. **Cross-navigation, analytics, commercial foundation** — full discovery graph,
   aggregate metrics, claim-a-profile groundwork.

Each slice: build → test → review before the next.

## Out of scope for every slice above

Payments, CRM, booking platform, ratings, reviews, AI-written local content, paid
placement mechanics, fabricated local knowledge of any kind.

SEO + LOCAL DISCOVERY ARCHITECTURE AUDITED.

LOCALITY + SERVICE GROWTH MODEL READY.

LEAD-GENERATION FOUNDATION DEFINED.

INDEXABILITY / QUALITY GATES DEFINED.

IMPLEMENTATION SLICES READY.

NO IMPLEMENTATION PERFORMED.
