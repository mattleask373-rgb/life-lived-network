# Reusable Market Onboarding Checklist

**Status:** Proposed operational checklist; requires human sign-off for each new market  
**Prepared:** 2026-10-20  
**Scope:** Reusable onboarding of a country/market using the existing platform architecture  
**Rule:** Adding geography is not the same as launching a market. A market is not live until the approved source, rights, safety, publication and verification gates have been met.

This checklist complements the wider 31 October launch plan. It does not authorize production writes, new partner feeds, credential activation, schema/RLS/grant changes, publication, or deployment. Country-specific legal requirements must be reviewed by an appropriately qualified human; this document is an engineering release checklist, not legal advice.

## 1. Non-negotiable architecture

- **Configure data, not country-specific application branches.** Use the existing place hierarchy, service taxonomy, ingestion boundary and shared page/discovery contracts. Introduce a new market-specific code path only after an architectural review demonstrates why configuration and existing seams are insufficient.
- **Keep one discovery authority.** The existing supply engine and findSupply() remain the single deterministic matching engine. New work or place records are inputs to the existing engine, not a reason to add another matcher, score, vector index or opaque ranker.
- **Unknown is not a negative answer.** Missing pay, dates, accommodation, transport, timezone, availability, qualification or source rights must remain unknown/not stated. Do not coerce an unknown into zero, false, unavailable, compliant or approved.
- **A taxonomy match is not publication approval.** Declared-vs-matched category evidence may describe what a record says; it cannot clear rights, prove qualifications, establish availability or override a policy/publication gate.
- **Staging is non-live.** New place/source/import data remain staged and unpublished until a human approves the hierarchy and the relevant data/source gates. Never seed plausible-looking sample listings to make a new market appear active.

## 2. Gate sequence

Each stage has an explicit evidence artifact. A blank, failed, stale or disputed item blocks the dependent stage; do not silently waive the gate.

| Gate | Required evidence | Fail-closed rule |
|---|---|---|
| A. Market decision | Named pilot area and scope; accountable owner; intended audience and launch claim; written minimum verified-record threshold | No market-live claim while scope or owner is undecided |
| B. Geography | Proposed place tree with stable source keys, unique canonical slugs, parent IDs, place kinds, ISO 3166-1 alpha-2 country code, and documented hierarchy approval | Invalid, duplicate, orphaned or cyclic places stay staged; no fallback to a different place |
| C. Locale, currency and time | ISO 4217 currency code, correct integer minor-unit handling, IANA timezone per place, locale/date-format rule, and tested DST/date-only/instant behavior | Never guess currency/timezone from a name, country, language or coordinate; missing values block affected displays/import rows |
| D. Taxonomy and policy | Existing canonical service/work taxonomy mapped to the market; review of employment, casual/contract, volunteering, skills-exchange and training distinctions; market-specific restricted-category matrix | Work category labels or keyword matches cannot bypass human policy review or qualification checks |
| E. Source and rights | Source owner/name, canonical source URL, access method, terms/licence URL, permitted fields and usage, attribution requirements, image-use rights, refresh limits, retention and takedown contact | Pending, ambiguous, restricted or withdrawn rights keep records unpublished and images undisplayed |
| F. Safety and moderation | Report/block/moderation ownership and response expectations; privacy/location precision review; qualification/insurance checks where applicable; abuse and urgent-safety escalation path | Private, blocked, reported, restricted or policy-blocked records must not leak into public discovery |
| G. Import validation | Dry-run report; schema and domain validation; stable source IDs; duplicate/idempotency checks; parent existence and cycle checks; coordinate pairing/ranges; source freshness; row-level rejection/quarantine counts | Validation is non-writing. Invalid or uncertain rows are reported and withheld, not silently repaired or published |
| H. Discovery integration | Existing canonical record shape; source/freshness/provenance preserved; deterministic supply bands and caveats; negative regression tests | No second matcher; capability, willingness, availability, journey and service area remain distinct |
| I. Public UX and SEO | Unknown/empty/error states; locale/currency/time rendering; accessible controls; canonical URL and 404 tests; the same approved indexability decision for page metadata and sitemap enumeration | Empty, thin, demo-only, stale, unlicensed, private or otherwise blocked URLs stay noindex and out of public sitemaps |
| J. Operational readiness | Monitoring for source failures/staleness; support and takedown contacts; rollback/retraction runbook; launch checklist; explicit go/no-go sign-off | No production import, partner activation, publication or deployment without the required human approval |

## 3. Geography and canonical URL contract

Before staging a new hierarchy:

- Define the exact pilot boundary and its parent chain (for example, country → state/region → area → city/town → neighbourhood only where those levels are real and useful).
- Confirm each row's stable external key, unique slug, parent reference, place kind and ISO country code. Verify every parent exists, children belong to the intended parent, and the graph has no cycles.
- Preserve canonical IDs and slugs once externally linked. Renames and parent changes require a redirect/migration plan and human review; do not create a second URL for the same place.
- Store approximate public place coordinates only when sourced and approved. Never convert a private home address into a public coordinate.
- Test parent, child, sibling, wrong-country redirect, unknown-place 404 and duplicate-slug cases with both fixtures and staged data.
- Keep unapproved rows as not-published; successful validation means “eligible for a disposable preview”, not “approved for production”.

## 4. Currency, locale, timezones and employment terms

### Money and locale

- Store compensation in integer **minor units** plus an explicit, validated currency code and basis (hour, shift, day, week, project, or another approved unit). Do not use floating-point money as the persisted source of truth.
- Do not assume every currency uses two decimal places. Validate currency codes and apply the currency's appropriate minor-unit precision when formatting; use locale-aware formatting only for display.
- Keep **stated paid**, **explicitly unpaid** and **not stated** as three distinct states. Zero is not the representation for unknown pay.
- Confirm placement of currency symbols, grouping, decimal separators, negative/large values, and long labels at narrow viewport widths.
- Use an explicit user/market locale policy for dates and numbers; language preference is not proof of country, currency or current location.

### Time and availability

- Store IANA timezone identifiers on places and use explicit-offset ISO timestamps for instants. Validate identifiers and offset/date inputs at ingestion.
- Distinguish a calendar date (such as a closing date) from an instant (such as an event start). Do not attach an invented time to a date-only record.
- Test daylight-saving transitions, ambiguous/nonexistent local times, UTC boundaries and records displayed in another user's locale.
- Never infer shift availability from an open-ended date range, a journey, a residence, a capability or an “open to work” preference. State exactly what the source said and what remains to be confirmed.

### Work and volunteering

- The record must explicitly distinguish paid employment/contract work, volunteering, skills exchange, unpaid training and not-stated engagement. A label, keyword or legal assumption must not make this decision for the source.
- Show only stated compensation, currency/basis, duration, start/end dates, accommodation, transport, requirements and conditions. Missing fields say “not stated”; they do not inherit nearby records' values.
- Market-specific reviewers must decide the rules for minimum pay, deductions, trial shifts, accommodation tied to work, worker classification, work eligibility, insurance, age restrictions and other locally relevant risks before publication.
- Skills and category matches never prove qualification. Regulated work requires the market's human-defined evidence/qualification check or is excluded/caveated under the approved policy.

## 5. Source, rights, attribution and lifecycle

For every proposed source, record and approve:

1. Source identity, canonical URL, access method and whether credentials are required.
2. Terms/licence URL and human review decision covering collection, storage, transformation, display, commercial use, refresh frequency, retention and removal.
3. Required attribution text/link and separate permission for photographs or other media. An image without confirmed display rights is not shown.
4. Stable external identifier or source key, update timestamp where available, last-checked time, freshness policy, and what happens when the source disappears or changes its terms.
5. Responsible source steward, contact/takedown path, and audit trail for rights-status changes.

Use the existing provider-neutral ingestion boundary (currently src/lib/ingest/) rather than leaking a provider's response shape into UI code. An adapter should normalize, validate and report rejected rows; it must not silently invent missing locality, dates, source URLs or rights. A source with missing credentials, pending review or unclear rights remains off.

## 6. Safety, privacy and moderation

Before the first record is made public:

- Assign a human owner for reports, blocks, appeals, source takedowns and urgent safety issues; define expected response windows and escalation.
- Confirm report/block/moderation states are respected by every public read, related-results surface, detail card, sitemap and structured-data output.
- Minimize public location precision. Do not publish a person's exact home address or expose a private person's presence, route, availability or contact details without appropriate consent.
- Review locally sensitive and regulated categories. Required credentials, registration, checks, insurance or legal eligibility are market-specific decisions; never infer them from a self-described skill or category.
- For work opportunities, review misleading/unpaid postings, unsafe accommodation/transport, discriminatory conditions, fee requests, identity/payment scams and suspicious external links. Define how users flag a record and how it is hidden while investigated.
- Maintain explicit demonstration/test-data boundaries. Demo records must never satisfy market-live criteria, public supply counts, SEO thresholds or structured data.

## 7. Discovery and conversion integration

- Map accepted records into the existing canonical domain shape through the current ingestion/normalization seam. Preserve the source's facts, freshness, rights, policy and demonstration state.
- Feed eligible records to findSupply(); preserve its named result bands, deterministic order, explanations and caveats. Do not add a second work-only ranker or reinterpret results in the UI.
- Keep capability ≠ willingness ≠ availability; journey ≠ live location or permission to contact; resident in a place ≠ service area; skill ≠ role ≠ qualification.
- A “request/ask” action must use the existing need → findSupply() path and describe what actually happens. It must not imply a host/provider was messaged, an application was sent, a booking was made or availability was confirmed unless that side effect really exists and is separately approved.
- Test no-candidate, unknown, stale, blocked, reported, expired, demo, rights-restricted, out-of-area and unavailable cases—not only the happy path.

## 8. Public pages, structured data and sitemaps

- Use one canonical indexability contract for page metadata **and** sitemap candidate enumeration. Do not duplicate or weaken the rule per route, country or sitemap.
- A place row or known category is not enough to index a landing page. Require real, published, non-demonstration records plus the required locality completeness, currentness, provenance, rights, policy and internal-link evidence defined by the current shared gate.
- Quiet/empty, thin, demo-only, unpublished, private, blocked, reported, stale, rights-restricted or policy-pending pages remain noindex and are omitted from sitemaps. Unknown places and service slugs return the defined not-found behavior.
- Canonical URLs must not multiply through tracking parameters, query filters, case variants or duplicate slugs. Test wrong-country redirects and query/fragment stripping.
- Emit BreadcrumbList, Event or LocalBusiness structured data only when the underlying real data is eligible, attributable, rights-cleared and visibly present on the page. Never emit schema for fictional/test records or imply a listing exists just because a category page exists.
- Validate XML, sitemap index and every child sitemap in CI or an approved preview. Compare emitted URLs with the gate's eligible candidate set; no private or demo URL may be emitted.

## 9. Staging, idempotency and rollback

Before any production import is proposed, the owner and engineering reviewer must see a dry-run artifact containing:

- Source/version and run timestamp; rows read, accepted, rejected, duplicated, updated and quarantined.
- Stable idempotency key for each row and explicit update semantics; repeated runs must not create duplicate places or records.
- Validation results for schema, URLs, rights, country code, currency, timezone, locale, parent references, cycles, coordinate pairs/ranges, freshness and required policy decisions.
- A reviewable diff from the last approved dataset, with deletions, parent changes, slug changes and rights changes called out separately.
- A tested rollback/retraction plan, recovery owner, audit trail and a statement of what cannot be rolled back (for example, external side effects or URLs already shared).

Validation must be pure/non-writing. The staged result must be inspected before any production write. No imports, migrations, RLS/grant edits, or feed activation are implied by this checklist.

## 10. Minimum regression matrix

A market is not ready for sign-off unless these classes are represented by automated tests or recorded manual evidence:

| Area | Must-pass cases |
|---|---|
| Geography | Unknown country/place; wrong parent; duplicate slug/source key; orphan; cycle; partial coordinates; canonical redirect |
| Currency/time | Integer minor units; unsupported code; currency with zero/three minor digits; locale formatting; missing/invalid IANA timezone; UTC/DST edge cases; date-only stays date-only |
| Work/policy | Paid/unpaid/not-stated remain distinct; integer amount + currency + basis; no inferred terms; pending rights/review excluded; regulated role without required evidence excluded/caveated |
| Provenance/lifecycle | No source URL/name; rights restricted/withdrawn; stale source; deleted upstream record; unsafe/missing image rights; attribution persists |
| Discovery | Existing findSupply() only; bands/caveats stable; service area is explicit; ability/willingness/availability/journey are not conflated; blocked/reported records excluded |
| Publication/SEO | Empty/demo/thin/private/stale pages noindex and absent from sitemap; valid page and sitemap eligibility agree; unknown service returns 404; structured data mirrors visible real facts |
| Safety/a11y | Report/block path works; public-location privacy preserved; long translated labels and locality names fit at 375px; keyboard focus/order visible; screen-reader labels; no nested interactive controls |
| Import/operations | Dry run writes nothing; repeated run is idempotent; rejected rows accounted for; rollback reviewed; source failure disables/marks stale instead of returning fabricated inventory |

## 11. Human go/no-go record

Before any market is labelled **pilot-live**, record the following in the release/decision log:

- [ ] **Product owner:** named scope, user promise, pilot boundary and minimum verified-record threshold approved.
- [ ] **Market/policy reviewer:** employment/volunteer distinctions, restricted categories, qualification evidence and local compliance questions reviewed.
- [ ] **Source steward:** source access, terms/licence, attribution, media rights, refresh and takedown path approved.
- [ ] **Data/engineering reviewer:** staged hierarchy/records validated, duplicate/idempotency behavior verified, no-write dry run and rollback reviewed.
- [ ] **Safety/moderation owner:** report/block/appeal, urgent escalation, privacy precision and abuse handling tested.
- [ ] **SEO/UX reviewer:** canonical route, gate-backed metadata and sitemap, empty state, structured data, accessibility and narrow-screen checks pass.
- [ ] **Operations owner:** health/staleness monitoring, owner/contact, failure behavior and rollback route are known.
- [ ] **Human release approver:** confirms the exact source/record set and exact commit/preview being authorized.

### Explicit rule for Australia and every later market

Australia remains **not live** until the pilot hierarchy is confirmed, provenance and source rights are approved, relevant real records are verified and publishable, and the human go/no-go record above is complete. Staged rows for Byron Bay, Agnes Water, Port Douglas or their parents—if prepared in the future—are not real public inventory and must not be published or indexed merely because they validate.

The same rule applies to every country. Passing a schema validator is necessary but insufficient; a configured currency, timezone, place tree or category does not prove that a live service, event, job, host or local opportunity exists.
