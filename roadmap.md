# Roadmap

## Now
- [ ] Birmingham live event discovery, UK-wide architecture (plan awaiting approval)
  - [ ] Ticketmaster Discovery adapter behind the existing source registry (needs API key from Matt)
  - [ ] Canonical event fields surfaced through existing activity model + cards/detail
  - [ ] Locality + date driven event retrieval (no city-specific code)
  - [ ] Reviewer-only refresh trigger, truthful freshness, quiet states
  - [ ] Tests: provider parsing, freshness, dedupe, geography, regression

## Blocked / needs Matt
- [ ] Ticketmaster Discovery API key (free tier) — nothing live can appear without it

## Already landed (groundwork, before this plan)
- [x] `sources` + `source_records` registry tables
- [x] Optional event fields on activity records (start/end, timezone, organiser, ticket URL, cancellation, imported/checked, origin)
- [x] Ingest contract, normalisation/sanitising, freshness, deduplication modules

## Deferred (not this build)
- Intent front door, My Living World, routing, extra providers, payments, bookings, feeds, realtime, AI matching
