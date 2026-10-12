# Ticketmaster adapter: safe path to a fixture-first pilot

Status: implementation plan only. No live credentials, external calls, production writes, or ingestion runs are authorized by this document.

## What exists in the repository

- `src/lib/ingest/ticketmaster.ts` builds Discovery API query parameters and parses a supplied payload. Its module comment explicitly says it does not reach the network.
- `src/lib/ingest/contract.ts` defines the provider-neutral `SourceAdapter` / `SourceEvent` boundary.
- `src/lib/ingest/normalise.ts` handles plain text, safe URLs, coordinates, instants and image eligibility.
- `src/lib/ingest/freshness.ts`, `dedupe.ts` and `refresh.server.ts` contain shared event quality, dedupe and refresh logic.
- `src/lib/ingest/ingest.test.ts` exercises parser behavior, malformed payloads, cancellation/postponement, geography parameters, and credential absence from query construction.
- Existing roadmap work is tracked in issues #16, #17, #18, #22 and #35.

These are repository findings; they do not prove any live API account, licence, or operational ingestion exists.

## Proposed sequence

### Gate 0 — rights and product scope (human review before live data)

- Record the current Ticketmaster Discovery API terms, attribution rules, image-display requirements, retention/caching rules, rate limits, and any commercial restrictions from official documentation.
- Do not assume an event link implies a right to copy event text or imagery. Store only fields allowed by current terms; prefer source URL and attribution over copied media.
- Confirm whether the intended use (local discovery, caching, public display, commercial partner product) is permitted.
- No API key is requested, stored, or connected until this gate is approved.

### Gate 1 — offline fixtures only (safe to implement now)

- Keep representative, clearly labelled synthetic fixture payloads in tests only; never make them appear as real events.
- Test valid events, missing dates/IDs, cancelled/postponed states, malformed URLs and coordinates, provider faults, empty responses, duplicate IDs, and unknown categories.
- Test query bounds (page size 1–100, non-negative page, radius floor, date normalization) and assert no credential appears in logged/query-builder output.
- Treat provider date/time semantics as a known review item: date-only values and timezone conversion must be interpreted using the event's declared timezone, not silently treated as UTC. Add tests before changing behavior.
- Verify all event writes pass through the existing normalisation, quality, deduplication, freshness and provider-neutral persistence path. Do not add a parallel discovery/matching engine.

### Gate 2 — disabled-by-default server adapter

Only after Gate 0 approval:
- Add a server-only network client with a strict timeout, bounded response size, explicit user-agent, rate limiting, and safe handling of non-2xx responses.
- Read the key from a server-only secret; fail closed when absent. Never expose it to Vite/client bundles, URLs visible to clients, logs, test snapshots, or error messages.
- Make live ingestion opt-in via a server-side feature flag that defaults off in all environments until explicitly approved.
- Validate the source response against expected shapes; reject oversized or malformed payloads.
- Store source provenance, fetched-at time, provider event ID and attribution. Make retries idempotent and dedupe stable across refreshes.
- Respect cancellations, postponements, expired events and stale-source behavior; never present a failed fetch as a confirmed empty locality.
- Provide a dry-run mode that reports counts and rejection reasons without writes.

### Gate 3 — sandbox and canary

- Use provider-approved sandbox/test credentials only if the provider supports them.
- Run one manually triggered canary in a non-production environment with synthetic/test locality data.
- Review stored fields, attribution, image URLs, retention, dedupe, cancellation handling and logs for secrets.
- Require a human go/no-go before any production key, production ingestion, or public event data rollout.

## Acceptance checklist

- [ ] Official terms and intended use reviewed and linked.
- [ ] No live key required for unit tests or fixture replay.
- [ ] Fixture data cannot enter production results (see fixture policy and PR #131).
- [ ] No browser/client bundle contains provider credentials.
- [ ] Failures are observable and distinct from an empty result.
- [ ] Retries are bounded and writes idempotent.
- [ ] Date-only and timezone cases are tested.
- [ ] Attribution and image rights are documented.
- [ ] Existing `findSupply()` remains the sole discovery authority.
- [ ] CI green; no merge/deploy until normal human review and approval.

## Explicit non-goals

No live API calls, credential creation, production database changes, automated external outreach, paid ranking, private-memory targeting, or fabricated event inventory.
