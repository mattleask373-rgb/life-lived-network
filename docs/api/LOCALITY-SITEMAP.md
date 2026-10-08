# Locality sitemap

**Status: IMPLEMENTED / NOT LIVE (empty until inventory reader wired)**

## Contract

- Child: `GET /api/public/sitemap-localities.xml`
- Index includes the child under `/api/public/sitemap.xml`
- A locality path is listed **only if** `realEntryCount >= 3` (same rule as public locality API `meta.indexable`)
- Demonstration-only or thin places are **omitted**, not noindex-listed
- Until a durable place inventory source is connected, the child returns a valid **empty** urlset (UNKNOWN inventory ≠ invented places)

## Safety

No second discovery engine. Counts must come from canonical world/locality readers.
