# Platform vs Market-Specific — Global Expansion Architecture

**Status:** reference architecture and market gate; this document does not activate another country.
**Canonical repo:** `mattleask373-rgb/life-lived-network`.
**Invariant:** reusable code is not proof of live country coverage.

## Platform capabilities already represented in code

The current repository represents several country-neutral concepts: canonical `places` IDs and parent/descendant locality scope; country/locality routes; separate timezone and currency fields on place/need models; listings, needs, capabilities, explicit service areas, availability windows and journeys; source registry/normalisation/freshness concepts; a shared world-entry representation; and one `findSupply()` engine. Existing supported geographies/data should be inventoried from the authoritative place table and current source registry at release time.

SEO also has a single source of truth in `src/lib/seo.ts`: canonical URLs, public/private route metadata, robots policy and sitemap builders. The current public sitemap should contain only routes/pages that actually exist and are eligible for indexing.

These abstractions are portable; their populated records and end-to-end workflows are not automatically portable.

## What each market must supply or configure

| Concern | Required market-specific input | Gate before enablement |
|---|---|---|
| Geography | Canonical source for countries, states/regions, cities, suburbs/localities; stable IDs, parent relationships, coordinates, source version | Licence approved; import tests pass; hierarchy and geospatial sanity checks pass |
| Activity and opportunity supply | Real host/provider/organiser listings and source adapters with permitted reuse | Publisher permission or lawful reuse basis; freshness and deletion process |
| Locale | Language, address presentation, date/time format, timezone data, pluralisation and accessible translations | Native/local review; no locale assumptions from residence |
| Currency and money | ISO currency codes, budgets/pricing semantics, decimal formatting, fees/refunds/tax if payments exist | Correct per place/offer; qualified financial/legal review before payments |
| Work and volunteering | Worker classification, minimum pay, visa/eligibility restrictions, accommodation safety, insurance, child/vulnerable-person safeguards | Qualified local legal review and moderated category policy |
| Privacy and identity | Data protection law, retention, consent wording, identity-verification provider/coverage and data transfer boundaries | Privacy/security assessment; no unverified badge claims |
| Trust and moderation | Language coverage, report categories, prohibited activity, response hours, escalation and emergency guidance | Staffed operations, translated policy and reporting drills |
| SEO and public content | Locality naming, canonical URL pattern, meaningful unique content threshold, public/secret distinctions and market sitemap | No thin pages; source-backed content; crawler output matches release |
| Provider integrations | Local mapping, transport/events, notification and payment providers; contract and API limits | Keys/config in server secrets only; quotas, SLA, attribution and costs reviewed |
| Support / commercial | Customer support, partner contracts, refunds/complaints, local entity and invoicing considerations | Named owner and local operating plan |

## Market enablement as a state machine

A market should move through these states, not a boolean "supported" setting that hides missing evidence:

1. **Research** — no public claims; identify geography, law, source providers and operator.
2. **Prototype** — fixtures or isolated sample import in development only, clearly labelled, not presented as live users or supply.
3. **Data-cleared** — source contracts/licences, attribution, update cadence, provenance and deletion rules reviewed.
4. **Operational pilot** — real local supply, local moderation/support, known escalation owner, security and route regression passed.
5. **Limited public beta** — explicit feature/region boundaries, monitored rollout and rollback.
6. **Expansion-ready** — evidence that support, fresh data, safety and performance can handle more localities.

A transition requires recorded acceptance evidence and a named approver. An unknown field means "not verified", not "passed".

## Cross-market identifiers and data rules

- Keep canonical place IDs stable across imports; retain source IDs separately with source provenance.
- Store coordinates only for places/venues where rights and accuracy allow them. Do not use this import path to infer a user's home address or live location.
- Treat timezone and currency as explicit locality attributes; do not infer them solely from browser language.
- Keep compensation, contribution/exchange and volunteering as distinct structured meanings, not free-text synonyms.
- Record `source_id`, source URL, licence/attribution, fetched/observed time, source version/checksum, validation status and reviewer for imported public data.
- Deduplicate conservatively. Conflicts should go to review, not silently overwrite trusted human-authored listings.
- Each source adapter must be bounded, rate-limited, retryable and disableable; its failure must not fabricate inventory or corrupt another market.

## Current limitation

This is an architecture plan, not proof that a multi-country release has been tested. Australia remains a prototype path only. No Australian live data or listing feed is activated by this document.
