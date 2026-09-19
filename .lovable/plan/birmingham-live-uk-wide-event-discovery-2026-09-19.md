# Birmingham Live → UK-Wide Event Discovery

Goal: in one hour, a real Birmingham event, from a real source, with real provenance, discoverable through the locality chooser that already exists — and the same code path works for Bristol, Manchester, London, Cardiff, Belfast, Dublin.

## A. What already exists and can be reused

- Locality hierarchy (country → region → locality → place) with UK, Ireland and Portugal, plus a locality chooser and descendant-aware retrieval. Birmingham is already data, not code.
- One canonical activity record and one conversion point, so anything imported becomes an ordinary Living World entry and the map, cards, detail sheet and Life List work unchanged.
- Bounded server-side retrieval with paging, batched images and people, honest quiet states, and freshness labelling.
- Source-attributed photography (credit, alt text, capped at six) already modelled.
- Groundwork landed before this plan: a generic source registry and source-record table, optional event fields on activity records (start, end, timezone, organiser, ticket link, cancellation, imported/last-checked, origin), and modules for sanitising imported text, judging freshness, and deciding when two records are the same event.
- Reviewer-only role and protected screen already exist, so an internal refresh control has a home.

## B. Build blockers

1. **No API key.** Nothing live can appear until a Ticketmaster Discovery key is supplied. No key will be invented, hard-coded, or placed in browser code.
2. Imported activity currently must belong to a person; source-derived activity has no owner. One small database change is needed.
3. Retrieval filters by locality but not yet by date or event-ness.
4. Cards and detail do not yet show date/time prominence, venue, source or ticket link.
5. Source tables are currently world-readable; they should stay readable enough to credit a source and no more.

## C. Birmingham fast path (shortest safe route)

1. Matt supplies the Ticketmaster Discovery key; it is stored as a server-side secret.
2. One small database change: source-derived activity may exist without an owner, while resident-posted activity still must have one.
3. One adapter: locality → `countryCode` + coordinates/radius + date window → normalise → resolve to the existing place → dedupe → store with provenance and freshness.
4. A reviewer-only refresh action pulls the next fortnight for the selected locality.
5. Retrieval gains a date window and upcoming-first ordering; past, cancelled and removed events never show as upcoming.
6. Cards and detail show when, where, venue, source and ticket link, with the source named.

## D. UK-wide path

Same adapter, different row. Each locality carries its country code and approximate coordinates already, so refreshing Bristol, Manchester, London, Edinburgh, Cardiff, Belfast or Dublin is the same action against a different locality. Where the source cannot express a locality exactly, coverage is approximated by radius and the approximation is stated rather than hidden. Ireland works because country code is data too.

## E. Provider status

| Source | Status |
| --- | --- |
| Ticketmaster Discovery (GB + IE coverage, event search by country, coordinates, date and category) | **Requires credentials** — free registration key, attribution required, results linked back to the source [2](https://developer.ticketmaster.com/products-and-docs/apis/discovery-manual/v2/) |
| Eventbrite | Requires review — public search is no longer generally available |
| Venue, council and community calendars | Requires review per organisation; the natural second wave, community-first |
| Resident submissions | Ready today, already live |

Storage is limited to what is needed to show and credit an event, with images linked from the source rather than copied, and a refresh that keeps data current rather than archived.

## F. Data model: existing vs required

Existing and reused: activity records, places, source registry, source records, photos with credit, freshness labels, origin marker.
Required: allow source-derived activity to have no owner; tighten who can read source records; no new event table, no second event concept.

## G. Ingestion pipeline

```text
SOURCE (row, not code)
  -> ADAPTER      locality + dates -> provider query
  -> NORMALISE    strip markup, validate dates, URLs, coordinates
  -> RESOLVE      venue + coordinates -> existing place
  -> DEDUPE       same time, same place, agreeing titles; otherwise keep both
  -> PROVENANCE   source, external id, source link, imported/updated times
  -> FRESHNESS    upcoming / on now / finished / cancelled / uncertain
  -> POLICY       cancelled, removed and past excluded from discovery
  -> ACTIVITY     ordinary Living World entry
  -> DISCOVERY    existing locality + date retrieval; never calls the source
```

The browser never talks to a source. Discovery never knows which source supplied an entry.

## H. UI (minimum)

- Event card: date and time first, venue, locality, source name, one image if permitted.
- Event detail: what, when, where, description, source link and ticket link when supplied, provenance and freshness line, cancellation state when applicable.
- Locality chooser: unchanged.
- Reviewer-only refresh control with last-run and failure state.
- Quiet state: "no current event data for this area" — never invented results.

## I. Tests

Provider: valid response, malformed response, missing fields, bad dates, bad coordinates, error, auth failure.
Events: normalisation, timezone, upcoming vs finished, cancelled, duplicate across sources, insufficient evidence keeps both.
Geography: Birmingham, Bristol, Herefordshire, London, Scotland, Wales, Northern Ireland, Ireland.
Discovery: locality, date window, freshness, visibility, paging.
Regression: existing 82 tests, people → capability → need → possibility → connection, moderation, Life List.

## J. Investor demo sequence

1. Open Birmingham → real upcoming events.
2. Open one → real title, date, venue, description, source and ticket link, provenance.
3. Switch to Bristol, then London → appropriate events, same machinery.
4. Narrow the date window → results change honestly.
5. Pick a quiet area → truthful "nothing here yet" rather than invention.
6. Show a person, a need and a connection still working.

## K. What is needed from Matt

- **A Ticketmaster Discovery API key** (free, from their developer portal). This is the single hard blocker.
- Confirmation that crediting Ticketmaster and linking to their event pages is acceptable for the demonstration.
- Nothing else; no accounts, no payment, no other service.

## L. Build order

1. Database: source-derived activity may have no owner; tighten source-record reads.
2. Adapter + registry entry for the source, off until a key exists.
3. Server-side refresh with provenance, dedupe and failure recording.
4. Date-aware, upcoming-first retrieval.
5. Event card and detail presentation.
6. Reviewer-only refresh control.
7. Tests, then full verification.
8. Refresh Birmingham, then Bristol, Manchester, London.

If the key arrives late, steps 1–7 still ship and the demonstration runs on clearly labelled demonstration content for Birmingham, with live data appearing the moment the key is added.

## Technical notes

- New database work is two statements: drop the owner requirement on activity records and add a rule that resident-posted activity still requires an owner. No table is replaced.
- The provider key lives only in server-side configuration, read inside the request handler.
- Refresh is a server-side action with bounded page counts and a per-source interval; no realtime, queues or streaming.
- Retrieval stays bounded and cursor-paged; images are lazy and no request is made per card.
- Source records keep public read only for the fields needed to credit a source.

BIRMINGHAM LIVE → UK-WIDE PLAN READY. BUILD MODE NEXT. NO IMPLEMENTATION PERFORMED.
