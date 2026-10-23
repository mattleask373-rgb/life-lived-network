# Privacy-safe funnel measurement — proposal

**Status:** contract and analysis proposal only. No instrumentation, analytics sink, database migration, or provider has been enabled.

## Canonical contract

Use `src/lib/measurement-events.ts` as the single event vocabulary. It validates a versioned, closed field set and normalizes the returned object. The older `measurement-contract.ts` implemented a parallel schema with a more precise event timestamp and overlapping names; it had no callers outside its own tests and has been removed to prevent future code from choosing between incompatible contracts.

Current event families include:
- Search and discovery: `search_submitted`, `locality_resolved`, `intent_resolved`, `results_viewed`, `quiet_result`.
- Voluntary actions and connection outcomes: `action_selected`, `connection_outcome`, `provider_response`.
- Supply and real-world outcomes: `contribution_created`, `useful_outcome_completed`, `return_discovery`.
- Need-to-response lifecycle: `need_submitted`, `need_status_changed` (`open_confirmed`, `met`, `withdrawn`, `expired`).
- Trust and safety: `report_submitted`.

The new need events contain only day-level UTC, a two-letter country code, and a bounded intent family (plus a bounded lifecycle outcome where applicable). They do **not** carry need visibility, title, description, arbitrary category labels, exact locality/coordinates, user/need/connection identifiers, contact details, message text, session IDs, raw queries, URLs or provider IDs.

## Funnel interpretation

A future dashboard can report daily counts for:

1. `search_submitted` — entry point and coarse query-length bucket.
2. `locality_resolved` and `intent_resolved` — resolution quality by the available coarse dimensions.
3. `results_viewed` versus `quiet_result` — whether current eligible supply was returned, and why a quiet state occurred.
4. `action_selected` and `connection_outcome` — voluntary next steps and connection outcomes.
5. `need_submitted` and `need_status_changed` — new asks and changes to the need lifecycle.
6. `provider_response`, `useful_outcome_completed` and `contribution_created` — reported responses, outcomes and supply-side contribution.
7. `return_discovery` — aggregate return-discovery activity.

**Important limitation:** this privacy-minimal schema intentionally has no stable person/session/need identifier. It supports aggregate event volumes and coarse rates when both events have compatible dimensions; it cannot calculate exact same-person conversion, attribution, retention cohorts, or the fraction of submitted needs later marked met. Do not label daily event-count ratios as user conversion rates. Any proposal to link events at session/person/need level needs its own privacy, consent, retention, access-control and human review.

## Query proposal (illustrative only)

No `measurement_events` table or sink currently exists. The following is query-shape guidance for a future reviewed, typed sink—not executable SQL against the current database:

```sql
-- Stage-volume dashboard only; not a person-level conversion funnel.
SELECT
  day_utc,
  country_code,
  intent_family,
  COUNT(*) FILTER (WHERE event_type = 'results_viewed') AS result_views,
  COUNT(*) FILTER (WHERE event_type = 'quiet_result') AS quiet_results,
  COUNT(*) FILTER (WHERE event_type = 'need_submitted') AS needs_submitted,
  COUNT(*) FILTER (
    WHERE event_type = 'need_status_changed' AND state = 'met'
  ) AS needs_marked_met,
  COUNT(*) FILTER (
    WHERE event_type = 'need_status_changed' AND state = 'withdrawn'
  ) AS needs_withdrawn
FROM reviewed_aggregate_event_sink
GROUP BY day_utc, country_code, intent_family
HAVING COUNT(*) >= 10;
```

The `HAVING` threshold is an initial suppression proposal, not a final privacy determination. Validate denominator size, sparse-cell disclosure, retention and access policy before selecting an actual threshold or publishing breakdowns. Outcome events are counted on the day they occur, not attributed to the original submission day.

## Measurement quality / bot handling

- Platform pageviews and referrers are not a verified-human measure. Sitemap, robots and health-check path activity should be separated from product journeys using edge/server request logs and known system-route lists, where available.
- Do not infer real-world completion from a click, accepted connection, or page visit. Use an explicit outcome event only where the product already has a trustworthy, user-confirmed status.
- Keep unknown, quiet, stale and unavailable states separate. Do not silently convert a failed read into zero demand or zero supply.
- Do not persist raw queries, need text, contact data, precise locality, IP addresses or arbitrary metadata in this funnel.

## Release gates and follow-ups

Before any sink is implemented:
1. Choose and document lawful purpose, consent/notice, retention and who can read aggregate event rows.
2. Create a separate reviewed schema/migration task with RLS, service-role boundaries, access and deletion/retention tests.
3. Decide whether aggregate-only metrics are enough; if not, review any linkage design separately rather than smuggling identifiers into this schema.
4. Add instrumentation only at verified server/client boundaries and tests demonstrating no event payload contains private text or identifiers.
5. Establish baseline coverage and known bot/system routes before publishing conversion, retention, CAC/LTV or scale claims.

This proposal is provider-neutral and intentionally does not write or transmit telemetry.
