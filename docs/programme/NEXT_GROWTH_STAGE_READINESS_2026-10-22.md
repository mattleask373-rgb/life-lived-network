# Next Growth Stage: Readiness, Evidence and Execution Gates

**Snapshot date:** 22 October 2026  
**Baseline reviewed:** `main` = `1f0a5d2b1c717db6cfc10c63f851a0e428313ee2`  
**Status:** Proposed execution plan; this document authorizes no production change, deployment, paid provider activation, database/RLS migration or autonomous merge.

## Decision

Do not begin broad global acquisition yet. The next stage is to prove one trustworthy journey from **search intent → current genuine supply → legitimate action → response → optional user-confirmed real-world outcome**, then replicate only what works.

Recent code progress is real: #304 bounded wide-area opportunity retrieval, #305 draft-assist emergency disable, #307 fail-closed sitemap scope, #308 fail-closed Life List sync handling and #153 Ticketmaster time-bound validation are on current `main`. Verify and CodeQL both pass for the audited main SHA. This is source/CI readiness, not proof the published host, live inventory, data permissions or full pilot path are ready.

## P0 — Public-host/source parity must pass first

Fresh GET-only checks of the published host found:

- `GET https://life-lived-network.lovable.app/sitemap.xml` → HTTP 404 with HTML instead of XML.
- `GET https://life-lived-network.lovable.app/robots.txt` → HTTP 200, but missing the sitemap directive and private-route crawler exclusions present in the current source.
- `GET https://life-lived-network.lovable.app/life-list` → HTTP 200; rendered HTML does not show the expected `noindex, nofollow` metadata or canonical omission from the current private-page source.

This demonstrates a published-build/host-route parity issue. It does **not** by itself prove private Life List data is exposed; no such data exposure was demonstrated by these HTTP responses. `robots.txt` is crawler policy, not access control.

**Owner gate:** confirm the intended public hostname, exact deployed build SHA, Lovable repository and non-main sync branch, and connected Supabase project in the official dashboards before any deployment or hosted setting change.

**Acceptance:** live smoke passes on the confirmed host/SHA for robots, sitemap index, every referenced child sitemap, canonical public pages and every private/noindex route. Child sitemaps must contain only canonical, fresh, genuine, rights-cleared/indexable records. Any incomplete/capped scan fails closed instead of returning plausible partial success. Verify authentication and data authorization separately; do not rely on crawler metadata for privacy.

Diagnose which build/route precedence is actually serving traffic before adding or changing more sitemap implementations: current source has both static public files and dynamic route handlers, but the served host does not match either expected result.

See canonical recovery task: [issue #263](https://github.com/mattleask373-rgb/life-lived-network/issues/263).

## Preserve these architectural invariants

- `src/lib/supply-engine.ts` / `findSupply()` remains the one deterministic discovery/matching authority. No second AI, vector, graph or opaque scoring matcher.
- Capability is not willingness or availability; living in a place is not serving it; a journey is not availability or live location; unknown is never confirmed.
- Quiet results beat invented supply. Fixtures remain test/preview data and never become production inventory.
- Broad-area reads stay bounded and fail closed. #304's caps are safe bounds, not proof of exhaustive global inventory.
- Imported records keep provenance, freshness, rights, cancellation and withdrawal state. Stale, unknown-freshness, cancelled, expired or demonstration-only records must not appear as genuine current inventory or qualify for indexing.
- Acceptance of a request is not proof that a meeting/service/event happened. Keep request, response and optional user-confirmed outcome distinct.

## Conflict-blocked PR disposition

Do not merge old branches wholesale. Port only unique useful behavior onto current `main`, with a minimal diff, exact-head checks and independent review.

| Candidate | Disposition |
|---|---|
| [#311 bounded opportunity completeness](https://github.com/mattleask373-rgb/life-lived-network/pull/311) | Fresh-main draft. Adds a limit+1 sentinel, fail-closed null reads and complete/partial/needs-places UI states while retaining the single matcher and existing 780-candidate maximum. Exact-head Verify [#39865070018](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39865070018) and CodeQL [#39865070010](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39865070010) passed on head `9fb539f86aa0d4dce81e9aecb75b753f3ec85f48`; independent review is still required before merge. |
| [#310 event-local timezone correction](https://github.com/mattleask373-rgb/life-lived-network/pull/310) | Fresh-main draft. Converts provider localDate/localTime via IANA timezone and preserves valid global timezone identifiers; rejects DST gaps/folds rather than guessing. Exact-head Verify and CodeQL passed, but independent review remains mandatory. |
| [#235 preview auth storage](https://github.com/mattleask373-rgb/life-lived-network/pull/235) | Blocked despite superficial mergeability. Create a fresh-main PR containing only the intended helper change plus focused tests. Validate exact trusted origin and sender window, strict reply schema and boolean, all localStorage error paths, timeout/absent broker, malformed replies and logout races. Independent security review required. |
| [#34 search front door + telemetry](https://github.com/mattleask373-rgb/life-lived-network/pull/34) | Do not merge as-is. It loses search intent in navigation: “Drake Birmingham” lands with only locality; “gardener Brixton” routes to `/need` without locality. Port a typed, validated contract that preserves locality, intent family, subject and timeframe. Add regression tests for those examples and “things to do Birmingham tonight”. |
| [#4 adversarial supply tests](https://github.com/mattleask373-rgb/life-lived-network/pull/4) → [#8 Possibility Contract](https://github.com/mattleask373-rgb/life-lived-network/pull/8) | Port #4 semantic negative tests first; then port the typed WHO/WHAT/WHERE/WHEN/WHY/UNKNOWN/ACTION adapter from #8 after the tests and contract are independently reviewed. Both branches use an old base. |
| [#179 global market checklist](https://github.com/mattleask373-rgb/life-lived-network/pull/179) | Port unique checklist items into the current canonical launch checklist, including rights, freshness, takedown, local support and an explicit human go/no-go. Place rows alone do not make a market live. |
| [#193 entry-card accessibility](https://github.com/mattleask373-rgb/life-lived-network/pull/193), [#195 details/map accessibility](https://github.com/mattleask373-rgb/life-lived-network/pull/195), [#243 journey visual update](https://github.com/mattleask373-rgb/life-lived-network/pull/243) | Consolidate only missing, tested keyboard/focus/touch/screen-reader fixes into a current-main PR. Do not reapply old design changes wholesale. |
| [#257 breadcrumb JSON-LD](https://github.com/mattleask373-rgb/life-lived-network/pull/257) | Defer until published SEO parity passes; then port onto current `main` and emit only for pages passing canonical indexability gates. |
| [#272 map/date-line scope](https://github.com/mattleask373-rgb/life-lived-network/pull/272) | Port only independently missing date-line or locality-scope fixes. Avoid duplicating the bounded query behavior already merged in #304. |
| [#172 open-need counts and validation](https://github.com/mattleask373-rgb/life-lived-network/pull/172) | Diff against current behavior before porting; some changes may be superseded by later merges. Preserve only demonstrated gaps. |
| [#175 staging validator](https://github.com/mattleask373-rgb/life-lived-network/pull/175) | Port a read-only validator before widening geography/import scope; no production writes. |
| [#43 Ticketmaster ingest](https://github.com/mattleask373-rgb/life-lived-network/pull/43) / [issue #35](https://github.com/mattleask373-rgb/life-lived-network/issues/35) | Reconcile with provider/fixture adapters already on main; never duplicate them. Roadmap records the live API key as absent and source as off. Live activation requires rights, credentials, attribution, freshness/cancellation/withdrawal checks and human approval. |
| [#299 migration lineage](https://github.com/mattleask373-rgb/life-lived-network/pull/299) | Blocked. Requires owner-confirmed Supabase project/history, clean and upgrade replay on a named disposable DB, RLS/grant/definer-function review, rollback proof and independent database security approval. No production migration. |
| [#266 grouped dependencies](https://github.com/mattleask373-rgb/life-lived-network/pull/266), [#267 hooks lint](https://github.com/mattleask373-rgb/life-lived-network/pull/267), [#268 ESLint JS 10](https://github.com/mattleask373-rgb/life-lived-network/pull/268) | Refresh against current main, run frozen-lockfile install/tests/lint/build/security checks, split broad churn and review actual lint changes before accepting. |
| [#120 tracked environment cleanup](https://github.com/mattleask373-rgb/life-lived-network/pull/120) | Likely superseded: current tree contains `.env.example`, and prior environment hygiene changes merged. Confirm history/tracking state, preserve unique work, then close rather than reintroducing the stale branch. |
| Older stacked agent/control-plane proposals | Do not bulk-merge. Reconcile every unique delta and dependency; defer nonessential autonomy work behind pilot trust, privacy, supply and operational support. |

## Dependency-ordered work plan

### 1. Restore release truth

- Confirm the live deployment target and SHA with the owner.
- Fix the real host/build/route precedence reason that robots and sitemaps differ from source.
- Run the existing live SEO smoke on the confirmed public host; retain the result as release evidence.
- Refresh stale agent status documents only against verified live PR/commit states. The current `docs/agents/STATUS.md` still describes #304/#305 as open even though they are merged.

### 2. Repair security and freshness

- Finish the current #311 exact-head Verify/CodeQL and independent review. Confirm the cap-plus-one sentinel, missing-row fail-closed behavior, and that the UI never presents bounded partial retrieval as definitive quiet.
- Independently review #310's source-local timezone conversion, date-only handling, IANA-name validation and daylight-saving gap/fold behavior; retain the no-guessing rule.
- Port #235's intended auth-storage fix and adversarial tests into a fresh branch; get an independent security review.
- Propagate `listings.last_checked_at` and explicit provenance/freshness/cancellation state through the existing normalization/mapping boundary. The indexability policy already fails closed if this evidence is absent; do not weaken it to publish more pages.
- Keep database/RLS changes out of scope until owner confirmation and disposable replay/security evidence exist.

### 3. Make search resolve into an actionable path

- Port search-context continuity from #34 without the stale branch’s duplicate telemetry implementation.
- Keep locality + subject + timeframe available to the canonical destination; use the existing supply engine for supply/discovery decisions.
- If a destination cannot support an action yet, explain what can actually be done instead of claiming that a message, booking or connection has occurred.

### 4. Prove one human-approved pilot

Choose the first locality/vertical based on observed demand, genuine opt-in supply, local policy, an accountable local steward and support capacity. Kings Heath/Birmingham is only a candidate: the roadmap records development fixtures, not a fully live market, and says the Ticketmaster key and genuine Guildhall information have not been supplied.

The pilot needs one complete real-data path: fresh provenance-backed records → honest local presentation → supported action → response/decline/no-response path → optional user-confirmed outcome → safe reporting/correction/takedown. Run in staging first; production cohort starts only with explicit human go/no-go.

### 5. Measure outcomes without surveillance

Use the existing `src/lib/measurement-events.ts` contract. It deliberately does not persist or transmit events. Do not use the old #34 telemetry design as-is: it captures normalized query/subject/timeframe and relies on regex-only privacy filtering.

If a durable measurement sink is later approved, define lawful purpose/notice/consent, minimal retention, access, deletion, aggregation and incident handling first. Measure coarse funnel stages only: query-length bucket, coarse locality/intent, result-count/freshness bucket, action kind, aggregated response state and optional self-reported useful outcome. Exclude raw/free-text queries, names, contacts, precise location, message content and account/session/target IDs. App use and clicks are not offline success; acceptance is not attendance or completion.

### 6. Replicate selectively

Expand one locality or vertical at a time only when the first pilot meets its predeclared quality and safety gates. Avoid broad acquisition, doorway-page generation and country-live claims while supply is empty, stale, demonstration-only or unreviewed.

## Proposed measurement and stop criteria

These are proposed acceptance criteria, not observed metrics:

- 100% of intent-route regression cases preserve the correct locality and requested subject/timeframe; ambiguity remains explicit rather than guessed.
- 100% of public host SEO smoke checks pass against the exact approved deployment SHA; zero private/noindex paths in public sitemaps.
- Zero fixture-only, cancelled, expired, provenance-missing or unknown-freshness records presented as genuine current supply.
- Every growth-facing action matches actual product behavior; no false messaging/booking/availability claims.
- Measurement schema rejects free text and personal/target identifiers; no persistence until reviewed.
- Named human owners for source rights, local moderation, provider correction/withdrawal and incident response before pilot.
- Public “Ask this place” and expanded paid AI stay off until [issue #290](https://github.com/mattleask373-rgb/life-lived-network/issues/290) is closed with durable atomic limits, multi-instance concurrency/replay controls, provider spend alerts/caps and a tested operator kill switch.

## Human approval remains mandatory

This plan does not authorize deploys, public AI, provider spend, data migration, schema/RLS/grant edits or outreach. Owners must confirm the real host/build/backend, select and staff a pilot, approve source rights and telemetry policy, and authorize any release. The repository rule remains: no autonomous merge to main, no force-push/history rewrite, and independent review before acceptance.

## Evidence links

- [Audited main commit](https://github.com/mattleask373-rgb/life-lived-network/commit/1f0a5d2b1c717db6cfc10c63f851a0e428313ee2)
- [Verify](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39861379764)
- [CodeQL](https://github.com/mattleask373-rgb/life-lived-network/actions/runs/39861379851)
- [Ruleset](https://github.com/mattleask373-rgb/life-lived-network/rules/24946178)
- [Canonical recovery issue #263](https://github.com/mattleask373-rgb/life-lived-network/issues/263)
- [Published sitemap](https://life-lived-network.lovable.app/sitemap.xml)
- [Published robots](https://life-lived-network.lovable.app/robots.txt)
- [Published Life List](https://life-lived-network.lovable.app/life-list)
