# Privacy-safe funnel measurement — proposal

**Status:** contract and analysis proposal only. No instrumentation, analytics sink, database migration, or provider has been enabled.

## Canonical contract

Use `src/lib/measurement-events.ts` as the single event vocabulary. It validates a versioned, closed field set and normalizes the returned object. The older `measurement-contract.ts` implemented a parallel schema with a precise event timestamp and overlapping names; code search found no callers outside its own tests. This PR removes it to avoid two incompatible event vocabularies.

Event families include:
- Search and discovery: `search_submitted`, `locality_resolved`, `intent_resolved`, `results_viewed`, `quiet_result`.
- Voluntary action and connection outcomes: `action_selected`, `connection_outcome`, `provider_response`.
- Supply and real-world outcomes: `contribution_created`, `useful_outcome_completed`, `return_discovery`.
- Need lifecycle: `need_submitted`, `need_status_changed` (`open_confirmed`, `met`, `withdrawn`, `expired`).
- Trust and safety: `report_submitted`.

The need events contain only a day-level UTC bucket, a two-letter country code, and bounded intent (plus a bounded state for lifecycle events). They do **not** carry need visibility, title, description, arbitrary category labels, exact locality/coordinates, user/need/connection identifiers, contact details, message text, session IDs, raw queries, URLs or provider IDs.

## Funnel interpretation

A future dashboard may report daily stage volumes for:
1. Searches and locality/intent resolution.
2. Result views versus quiet results, with stale/unavailable/scope-too-wide states kept separate.
3. Voluntary actions and aggregate connection outcomes.
4. New need submissions and reported lifecycle changes.
5. Provider responses, explicitly reported useful outcomes and contributions.
6. Return-discovery activity.

**Important limitation:** this schema has no stable person/session/need identifier. It supports aggregate volumes and compatible coarse-dimension rates, but cannot calculate exact same-person conversion, attribution, retention cohorts, or the percentage of submitted needs later marked met. Do not label daily event-count ratios as user conversion. Any linked-event design needs its own privacy, consent, retention, access-control and human review.

## Query proposal (illustrative only)

No measurement sink or table exists yet. This is future query-shape guidance, not executable SQL against the current database:

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

The `HAVING` threshold is only an initial suppression proposal, not a signed-off privacy guarantee. Validate sparse-cell disclosure, retention and access controls before publishing breakdowns. Outcome events are counted on the day the outcome occurs, not attributed to the original submission day.

## Measurement quality and rollout

- Pageviews/referrers are not verified-human outcomes. Keep known system/crawler routes separate where reliable system logs are available.
- Do not infer completion from a click or page visit. Use outcome events only when based on a trustworthy, user-confirmed product state.
- Do not silently turn a failed read into zero demand or zero supply.
- Do not persist raw queries, need text, contact data, precise location or arbitrary metadata.
- Before any sink is implemented, choose lawful purpose, notice/consent, retention, access and deletion rules. Create a separate migration/sink PR with RLS and retention tests. The present work is contract/documentation only.

No telemetry has been instrumented or transmitted by this proposal.
