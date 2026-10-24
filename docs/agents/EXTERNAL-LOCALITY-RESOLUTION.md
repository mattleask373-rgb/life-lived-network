# Deterministic event locality resolution

**State: implemented as a draft source-only change. Not merged, not deployed, and not proof that a live provider is approved or enabled.**

## Why this exists

A radius-based event search is a discovery query, not proof that every returned event belongs to the centre locality. Earlier import code attached every result to the requested `place_id`. That could mislabel an event from a neighboring city and make it appear in the wrong local discovery page.

## Resolution rule

1. Load the canonical `places` hierarchy with the existing bounded, exact-count, fail-closed `loadPlaceIndex()` implementation.
2. Validate the refresh locality's canonical ID, two-letter country code, configured source coverage and valid IANA time zone **before** querying the provider. The old implicit UK/London fallback is removed from reviewer-triggered source refresh.
3. Use the source-declared venue city/locality label and the source venue country code when present. A provider-supplied canonical locality slug is preferred when one exists.
4. A locality name resolves only when it has one exact normalized match in the query country and is in the configured source coverage. Canonical parent/child scope is respected. Source coverage alone is not used to disambiguate repeated names.
5. Venue name, artist name, approximate coordinates, the search radius and the query-centre locality are not locality identity.
6. Missing, malformed, country-conflicting, ambiguous or out-of-scope evidence stays unresolved. No public listing is written for a new unresolved event.
7. A source-record row with `listing_id = NULL` can preserve the provider identity, public source URL, payload hash and seen/state timestamps to prevent duplicate identity rows while a later refresh retries locality resolution. It deliberately does **not** snapshot event text or raw provider payload; a retained-content schema and retention policy need separate rights/retention review.
8. If an event that previously had a listing can no longer be resolved, that listing is moved to `draft` before source provenance is updated. Cancellation/removal is also reflected. A subsequent successful resolution can update the listing to the correctly resolved canonical place and restore its `published` status.

## Provider evidence

The Ticketmaster Discovery API's venue model documents `city.name` and `country.countryCode`; the adapter now preserves the country code. See the [official Discovery API documentation](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/). This is a source contract only; no API call or credential was used by this change.

## Performance and failure behavior

- The canonical hierarchy is scanned once per bounded, reviewer-triggered refresh and the locality resolver precomputes ID/slug/name indexes once per batch.
- If the hierarchy, requested country, or source coverage cannot be confirmed, the refresh stops before making a provider request.
- If one event's locality cannot be resolved, the run records a safe reason and continues with the other events. That event does not become public inventory.
- The provider query remains country-filtered and bounded; exact source rows use the one existing event domain and canonical listing lifecycle.
- No new ranking or matching engine is introduced.

## Remaining gates and known limitations

- No SQL migration, RLS/grant change, hosted data write, secret, provider activation, production setting or deployment is part of this PR.
- The source-record reference is not an event content snapshot; unresolved event details cannot be displayed or indexed until they can be safely represented and resolved.
- Source coverage's empty `place_ids` means there is no explicit allow-list in the current contract. The query is still constrained to its selected canonical locality's country. A product/source owner should set explicit coverage for restricted sources before activation.
- The current importer still has a separate non-transactional listing+provenance write sequence and other unchecked DB results covered by draft [PR #387](https://github.com/mattleask373-rgb/life-lived-network). Do not merge overlapping refresh-code changes without a reviewed rebase and fresh exact-head CI.
- Current price-state draft [PR #392](https://github.com/mattleask373-rgb/life-lived-network/pull/392) also modifies `normalise.ts` and `refresh.server.ts`; plan a three-way integration/rebase with #387 and #392. This branch is based on current main, not on those drafts.
- Before any live source is enabled, reviewers must verify source rights, country coverage, attribution, quotas, cache/removal obligations, and the migration-free behavior on a disposable test stack.
- Manual global locality QA remains required for repeated city names, missing city/country, country mismatch, cities near borders, date-line coordinates and unsupported country/time-zone metadata.

## Acceptance tests in this slice

- Exact slug / exact unique name resolution.
- Diacritic/punctuation normalization with country boundaries.
- Repeated names fail closed; source coverage is not used as false evidence of an event's city.
- Out-of-coverage, missing/malformed country and unknown locality stay unresolved.
- Ticketmaster country code flows through parsing and normalization.
- Fixture country evidence is explicit; a venue fixture without country is not assigned a fabricated country.
