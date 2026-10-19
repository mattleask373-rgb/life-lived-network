# Australia locality staging — source and approval gate

**Status: PREPARATION ONLY. No Australian place rows are imported or published.**

This document records a repeatable path for a candidate pilot set; it does not assert that any Australian locality is live or that its coordinates have been source-validated. The founder/product owner must confirm the pilot choice and the intended parent hierarchy. Every source row, licence, coordinate reference system and proposed crosswalk must pass review before a disposable-database preview.

## Candidate scope

| Candidate | Country code / currency | Timezone candidate | Required source work |
|---|---|---|---|
| Byron Bay | `AU` / `AUD` | `Australia/Sydney` | Retrieve the current official NSW Geographical Names Board record; verify status, point coordinates, licence and datum. The older Data.NSW register metadata must not be treated as a fresh coordinate extract. |
| Agnes Water | `AU` / `AUD` | `Australia/Brisbane` | Match the approved place-name record in the Queensland Place Names Gazetteer; verify current status, point, field meanings, CRS and attribution. |
| Port Douglas | `AU` / `AUD` | `Australia/Brisbane` | Match the approved place-name record in the Queensland Place Names Gazetteer; verify current status, point, field meanings, CRS and attribution. |

Timezone values are candidates to validate against the IANA Time Zone Database and the final locality crosswalk. They are not a substitute for a source-validated place record.

## Authoritative source candidates

1. **Queensland Place Names Gazetteer** — https://www.data.qld.gov.au/dataset/place-names-gazetteer-queensland-txt-file/resource/414391b9-7943-4fc3-a237-a1ac57b75aab. Queensland Government metadata describes the gazetteer as approved names under the Place Names Act, represented as latitude/longitude points, under Creative Commons Attribution 4.0. The resource metadata reports a 1 October 2026 update. Confirm the actual downloaded file's metadata and CRS before using its coordinates.
2. **NSW Geographical Names Register** — https://www.nsw.gov.au/environment-land-and-water/spatial-data-and-mapping/foundation-spatial-data-framework/place-names. NSW Government describes this as the official register with location, feature type, gazettal status and date, updated as names are approved or changed. The Data.NSW downloadable record currently exposes older metadata (last updated 2016): https://data.nsw.gov.au/data/dataset/geographical-name-register-of-nsw/resource/af4e95e2-0dda-44c4-9324-4a025169545c. Do not use that older export as current without confirming the record with the live authority and reviewing the licence/terms.
3. **ABS ASGS Edition 4 digital boundaries** — https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-4-july-2026-june-2031/access-and-downloads/digital-boundary-files. Edition 4 uses GDA2020 and is released progressively. It is a statistical geography source, not evidence of local jobs, events or service availability, and its boundary centroid must not be presented as a business entrance or a person's location.
4. **IANA Time Zone Database** — https://data.iana.org/time-zones/tzdb/. Confirm local time rules from the current timezone database, not fixed UTC offsets.

## Proposed hierarchy to verify

- Byron Bay: `Australia → New South Wales → [source-verified administrative parent] → Byron Bay`.
- Agnes Water: `Australia → Queensland → [source-verified administrative parent] → Agnes Water`.
- Port Douglas: `Australia → Queensland → [source-verified administrative parent] → Port Douglas`.

The administrative parent must come from the chosen, licensed source and the founder-approved public hierarchy. Do not silently mix statistical areas, local government areas, tourism labels and official localities into one level. Preserve source keys and names so ambiguous or duplicate parent mappings can be reviewed instead of coerced.

## Import gate

1. Capture the original source file, checksum, download timestamp, source version, terms URL and attribution text.
2. Preserve the provider's identifier and source status. Explicitly map source rows to canonical slugs and parent source keys; review name variants and duplicates.
3. Validate unique source keys/slugs, a complete parent tree, no self-parenting or cycles, country/currency, IANA timezone, coordinate ranges and datum conversion. Record any rejected or ambiguous row.
4. Human-review each source and its intended storage, transformation, display, redistribution, retention and deletion rights. A public URL is not by itself consent or a commercial licence.
5. Run the pure `normalizeStagedPlaceBatch()` report; only an all-clear batch can proceed to a separately approved disposable-database preview. It never creates IDs, writes database rows, or publishes pages.
6. Obtain a signed-off insert/update/reject/ambiguous diff, test idempotency and rollback, then seek separate approval for any actual import. Production writes remain out of scope for this PR.

## Known schema question

The existing canonical `Place` type requires a timezone string on every place. Australia spans multiple civil-time regions. Before creating a country-level row, product/architecture review must decide what a country-level timezone means (rather than falsely implying one timezone applies to all child localities) and how that choice flows into the existing database contract. This staging PR deliberately does not change the schema or select a misleading value.

## Explicit non-goals

No Australian source file is checked into the repository, no coordinates are guessed, no locality records are inserted, no production data/schema/RLS/grants are changed, and no Australian inventory is claimed. The market remains **NOT LIVE** until real, rights-cleared supply and trust/safety operations independently pass the launch gate.
