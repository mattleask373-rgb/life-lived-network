# Lovable Handoff — Indexable Sitemap Contract

**State: IMPLEMENTED CONTRACT / NOT LIVE**

When the public locality API is reconciled with the main branch, the UI/surface
layer can consume the indexability decision without inventing its own SEO logic.

## Data contract

Use `buildIndexableSitemapPage(candidates, page, pageSize)`.

Each candidate contains:

- `path`
- `indexable`
- optional `lastModified`

Only indexable candidates enter XML output. Ordering is deterministic and paging is
bounded to at most 50,000 URLs per page.

## Truth and privacy

- Never manufacture indexability in the UI.
- Do not include demo or thin records.
- Do not expose private/profile/need data.
- Consume the server's indexability decision.
- This contract creates no discovery or ranking engine.

## Integration

The existing `seo.ts` primitives remain authoritative for absolute URLs and XML.
PR #110 can later supply the candidate set after human reconciliation.

No deployment or external publishing is implied.
