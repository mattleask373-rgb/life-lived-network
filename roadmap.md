# Roadmap

## Done
- UK & Ireland geography, locality picker, descendant discovery (Slice 1)
- Human possibility, connection requests, safety, moderation review (Slice 2)
- Event pipeline: source registry, adapter, normalise, dedupe, provenance, freshness (Slice 3A)
- Kings Heath first locality: development fixture feed (no network), service and
  practice representation with truthful booking states, service answers on a
  need, reviewer source health

## Open (blocked)
- Live Birmingham events: waiting on a Ticketmaster API key. The source stays
  switched off and says "Live source not configured" until one is supplied.
- Genuine Guildhall details (hours, practices, practitioners, booking pathway):
  waiting on the organisation. Until then those records are labelled
  demonstrations and nothing is bookable.

## UK-wide scale fabric (done)
- 221 localities across UK nations, counties/council areas, cities, towns, neighbourhoods; Ireland separate; Portugal/Lisbon preserved and non-default.
- Hierarchy expanded behind the server boundary, so a nation-wide choice no longer sends thousands of localities over the wire.
- Broad selections never silently filter by a partial slice; reads stay bounded and paged.
- Quiet places say so, and offer stepping out to a wider area.
- Locality picker shows how many more places sit inside one.
- Geography tests: src/lib/places.uk.test.ts (147 tests total).

### Still honestly missing
- Ticketmaster live events: waiting on TICKETMASTER_API_KEY.
- The Guildhall's real hours, practitioners and booking pathway: waiting on the organisation.
