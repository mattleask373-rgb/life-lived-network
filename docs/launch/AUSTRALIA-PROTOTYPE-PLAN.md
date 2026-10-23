# Australia Prototype Plan — No Data Loaded

**Status:** non-executing plan only.
**Market state:** NOT LIVE. No Australian real-world data is being loaded in this cycle.
**Purpose:** define a repeatable, rights-cleared way to test whether the existing place-first and canonical discovery model adapts to another market.

## Candidate geography source

The Australian Bureau of Statistics' Australian Statistical Geography Standard (ASGS) Edition 4 covers July 2026–June 2031. ABS documentation says its digital boundary files are available as GeoPackage or ESRI Shapefile and, unless noted otherwise, are licensed under Creative Commons Attribution 4.0 International. ASGS Edition 4 is released progressively; the 14 October 2026 update includes some additional structures, while others have future release dates. Never treat an incomplete edition as complete.

Official reference: https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-4-july-2026-june-2031/access-and-downloads/digital-boundary-files

This is a **candidate for geographic scaffolding**, not a chosen or imported source. It does not itself provide current jobs, hosts, accommodation, events or experiences. Human review must confirm the correct geography level and exact licence/attribution for each downloaded asset before any import.

## Source requirements

For every dataset or feed, record:
- publisher/owner and canonical source URL;
- data licence and rights for storage, transformation, display, redistribution and commercial use;
- required attribution text/logo and where it is shown;
- allowed retention/cache period, update cadence and deletion/notice process;
- coverage and limitations, time zone, CRS/datum, coordinate precision, schema version and known quality issues;
- data steward and approval record.

Separate **geographic structure** (state/territory, LGA, suburb/locality or selected urban areas) from **real activity/supply** (venues, events, opportunities, community projects, people). Each requires its own source and rights review. Do not scrape a consumer marketplace merely because its page is publicly viewable.

## Prototype path (no execution in this cycle)

1. **Pick one test area by decision, not assumption.** Founder selects a pilot locality after assessing potential supply owners, moderation capacity and source rights. No city choice implies it is live.
2. **Download only to an isolated development workspace after source approval.** Preserve the original file; record checksum, download date, terms URL and source version.
3. **Build a staging normaliser, not a direct production import.** Map source geography into canonical place fields: stable market-specific source key, parent ID, display name, country code `AU`, coordinates/geometry if permitted, timezone, currency `AUD`, source provenance, licence, status and freshness.
4. **Validate before staging output:** unique IDs and slugs; unique parent references; acyclic hierarchy; no self-parent; coordinate bounds and correct datum conversion; canonical timezone values; ISO currency; UTF-8/normalised names; duplicate/near-duplicate review; record-count reconciliation; expected coverage and gap report.
5. **Require preview approval.** Generate a signed-off diff/report showing inserted, updated, rejected and ambiguous records. No ambiguous row should be silently coerced.
6. **Pilot with a versioned import batch:** isolated DB or disposable database, idempotent run key, no deletes by default, rollback plan, audit log and post-import invariant checks. Do not change production tables, RLS or grants in a prototype PR.
7. **Verify UI & search:** country/locality URL structure, local names/diacritics, timezone and currency display, parent/child browse, source attribution, empty locality and no-data states, query bounds and pagination.
8. **Enable only after supply is real:** independently source and verify actual providers/opportunities, confirm rights, freshness, owner consent, moderation and local support. Until this gate passes, Australia must show no live inventory and must not appear in marketing claims.

## Risks and design implications

- ASGS is a statistical geography and may not match user-facing suburbs, tourism destinations or postal addresses. Choose the geography level based on user needs and locality source rights.
- Edition 4 is progressive; keep the source edition and per-structure release dates explicit.
- ABS boundaries use Geocentric Datum of Australia 2020 (GDA2020) in the new release; geospatial transforms must be validated rather than assuming all input coordinate systems are identical.
- A boundary polygon centroid is not a person's position, business entrance or proof of service coverage.
- Australian work/volunteering policies need local legal review. The Australian Fair Work Ombudsman warns that arrangements labelled "volunteering" can still be employment where the actual arrangement creates an employment relationship: https://www.fairwork.gov.au/starting-employment/unpaid-work
- Indigenous data and culturally sensitive place information require additional care, consultation and provenance; public availability is not automatically consent to republish every use.

## Completion criteria for a future Australia prototype

- Source and licence approved in writing.
- A repeatable import report with checksums, validation failures and attribution preview.
- No production writes; tested rollback on disposable data.
- A country-specific test matrix for `AU`, `AUD`, timezone/locale, URL paths and service-area logic.
- A live-data go/no-go signed by product, data-rights/legal and trust/safety owners.

**Explicit statement:** This plan loads no Australian data. It creates no live Australian listing, event, person, job or service-area claim.
