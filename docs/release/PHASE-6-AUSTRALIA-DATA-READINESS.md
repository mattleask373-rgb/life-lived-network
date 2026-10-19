# Phase 6 — Australian Locality Data Readiness Specification
**Last verified:** 2026-10-19 09:34 Europe/London (GitHub repository, PR and ruleset metadata rechecked; no live runtime or production test).  
**Verified main HEAD:** `5f06fc336a748cf37c6a06ac272bee4a387bd745`  
**Date:** 2026-10-19  
**Status:** Specification only. No data imported. No synthetic places created.

## 1. Current verified state

- Repository code search: **zero** Australian place records, country codes, or locality fixtures found.
- Live production database: **not inspected** (no authorised read access from agent sessions).
- Default locality remains UK & Ireland oriented (made configurable via #170).
- Geography model itself is country-agnostic and ready.

**Conclusion:** Australian coverage is **UNKNOWN / absent from repository**. It must stay out of any limited-beta claim until the gates below are satisfied.

## 2. Minimum data-readiness requirements before any “Australia supported” claim

### A. Authoritative source
- Named, rights-cleared dataset (government open data, licensed commercial source, or explicitly approved internal dataset).
- Licence / terms of use recorded.
- Attribution text ready for UI / legal page if required.
- Refresh / update process defined.

### B. Data quality contract
Every imported place record must provide or allow derivation of:
- Canonical stable ID / slug
- Human-readable name (and common aliases if available)
- Country = Australia
- State / territory
- Parent-child relationships (country → state → region/city → locality)
- Centroid coordinates (validated ranges)
- Timezone
- Provenance (source + import timestamp)

### C. Import process requirements
1. Preview / dry-run mode that shows counts and sample records without writing.
2. Deduplication against existing places.
3. Validation failures must fail the import (or quarantine), never silently drop required fields.
4. Rollback plan (how to remove or disable an import batch).
5. Post-import verification queries (counts by state, orphan detection, coordinate sanity).

### D. Application behaviour after import
- Empty localities still render honest empty / quiet states.
- No fabricated supply, needs, or activity.
- Service-area matching continues to require explicit declaration (after #163).
- Configurable default locality can point at an Australian slug **only after** that slug exists and is verified.

## 3. Explicit non-goals for this phase
- Inventing or seeding synthetic Australian towns.
- Claiming live Australian coverage based only on the country-agnostic model.
- Running any production import without founder sign-off on source + licence + rollback.

## 4. Recommended founder decision

**For the current limited beta:** Keep Australia **out of scope**.

**For future expansion:** Approve a named data source and import plan before any load.

## 5. Handoff checklist (when ready to expand)
- [ ] Source + licence approved
- [ ] Sample extract reviewed
- [ ] Import script / migration reviewed
- [ ] Dry-run results posted to #125
- [ ] Founder sign-off to load
- [ ] Post-import verification posted
- [ ] Default-locality config updated only if desired
- [ ] Limited-beta / marketing language updated only after the above
