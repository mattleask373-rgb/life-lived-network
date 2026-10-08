# Public Locality API

## Status

**IMPLEMENTED / NOT LIVE / HOSTED PROOF PENDING**

The public locality API is a read-only server route over the existing locality and
canonical world/discovery boundaries. It does not create a new matcher, ranking
engine, ingest path, or data authority.

## Endpoint

`GET /api/public/locality/:country/:place`

Example shape:

```json
{
  "apiVersion": "2026-10-08",
  "locality": {
    "id": "…",
    "name": "…",
    "slug": "…",
    "kind": "city",
    "countrySegment": "gb",
    "path": "/gb/example"
  },
  "ancestors": [],
  "children": [],
  "siblings": [],
  "entries": [],
  "meta": {
    "entryCount": 0,
    "indexable": false,
    "generatedAt": "2026-10-08T00:00:00.000Z"
  }
}
```

### Guarantees

- Read-only; no client authentication is required for genuinely public data.
- Uses the same place hierarchy as the locality page.
- Uses the canonical `fetchWorldEntries()` / `getWorld()` discovery path.
- Country mismatches redirect to the place's canonical URL.
- Demonstration records never make a locality indexable.
- UI-only map coordinates are not exposed by this API contract.
- External/source provenance is preserved where already present.
- Missing locality is a 404; no invented fallback locality is returned.
- The response is bounded to 60 canonical entries.

### Security and truth boundary

No credentials are accepted by this endpoint. It only exposes data already
available through the public server reader and existing public discovery
semantics. Private/profile/need data are not included.

This is not a booking, availability, enquiry, or external-action API.

### Verification state

Local/pure contract tests are included. Hosted endpoint, migration, and
deployment verification remain pending. Do not describe this endpoint as
production-live until deployment evidence exists.
