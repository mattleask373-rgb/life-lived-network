# Australia locality staging — source and approval gate

**Status: PREPARATION ONLY. No Australian place rows are imported or published.**

This document records a repeatable path for a candidate pilot set; it does not assert that any Australian locality is live or that all coordinates have been reviewed. Official Queensland gazetteer point candidates are now present for Agnes Water and Port Douglas; Byron Bay and parent nodes still have null coordinates. All rows remain unpublished, with source review/rights status pending, and require human confirmation of source version, CRS/meaning, hierarchy and intended use before a disposable-database preview.

## Candidate scope

| Candidate | Country code / currency | Timezone candidate | Required source work |
|---|---|---|---|
| Byron Bay | `AU` / `AUD` | `Australia/Sydney` | Retrieve the current official NSW Geographical Names Board record; verify status, point coordinates, licence and datum. The older Data.NSW register metadata must not be treated as a fresh coordinate extract. |
| Agnes Water | `AU` / `AUD` | `Australia/Brisbane` | Point candidate `(-24.2125857, 151.90327882)` from Queensland Place Names Gazetteer REF_NO `39140`; source record reports population centre and modified `2026-01-13`. Human must confirm record version, CRS/use and the parent crosswalk. |
| Port Douglas | `AU` / `AUD` | `Australia/Brisbane` | Point candidate `(-16.49944, 145.46083)` from Queensland Place Names Gazetteer REF_NO `48847`; source record reports locality bounded and modified `2026-01-13`. Human must confirm record version, CRS/use and the parent crosswalk. |

Timezone values are candidates to validate against the IANA Time Zone Database and the final locality crosswalk. They are not a substitute for a source-validated place record.

## Authoritative source candidates

1. **Queensland Place Names Gazetteer** — https://www.data.qld.gov.au/dataset/place-names-gazetteer-queensland-txt-file/resource/414391b9-7943-4fc3-a237-a1ac57b75aab. The service metadata identifies the official Queensland Place Names Database, license CC BY 4.0, and requested attribution `© State of Queensland (Department of Resources) 2024`. Candidate queries: [Agnes Water REF_NO 39140](https://spatial-gis.information.qld.gov.au/arcgis/rest/services/Location/QldPlaceNames/MapServer/0/query?where=REF_NO%3D39140&outFields=REF_NO%2CPLACE_NAME%2CDESCRIPTION%2CSTATUS%2CCURRENCY%2CMODIFIED_DATE%2CLGA_NAME%2CLONGITUDE_DD%2CLATITUDE_DD&returnGeometry=false&f=pjson) and [Port Douglas REF_NO 48847](https://spatial-gis.information.qld.gov.au/arcgis/rest/services/Location/QldPlaceNames/MapServer/0/query?where=REF_NO%3D48847&outFields=REF_NO%2CPLACE_NAME%2CDESCRIPTION%2CSTATUS%2CCURRENCY%2CMODIFIED_DATE%2CLGA_NAME%2CLONGITUDE_DD%2CLATITUDE_DD&returnGeometry=false&f=pjson). The service describes points as named-place locations and not precise navigation/address coordinates. Licence fields are recorded as candidates only; `rightsStatus` remains `unreviewed` until a human confirms the intended use and attribution. Queensland Government metadata describes the gazetteer as approved names under the Place Names Act, represented as latitude/longitude points, under Creative Commons Attribution 4.0. The resource metadata reports a 1 October 2026 update. Confirm the actual downloaded file's metadata and CRS before using its coordinates.
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

No Australian source file is checked into the repository, no missing coordinates are guessed (Byron Bay and parent nodes remain null), no locality records are inserted, no production data/schema/RLS/grants are changed, and no Australian inventory is claimed. The two Queensland gazetteer points are non-navigation candidates; source review, retrieval/version evidence, coordinate meaning, hierarchy approval and rights approval are still pending. The market remains **NOT LIVE** until real, rights-cleared supply and trust/safety operations independently pass the launch gate.
