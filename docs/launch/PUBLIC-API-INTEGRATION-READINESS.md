# Public API & Integration Readiness

**Evidence baseline:** current `main` tree at `0c56cc299825dea5996323506e7a1cc9266975c8` on 19 October 2026. This is a static code inventory, not a penetration test, running-route crawl, or guarantee every server function is publicly reachable.

## Executive assessment

The application uses TanStack Start server functions as its main application action/read boundary. These should be treated as internal app RPCs unless deliberately documented and versioned as a public API. This inspection did not find a declared, stable, versioned third-party REST API contract. The existence of server functions does not by itself make them safe to expose to external integrators.

SEO/crawler endpoints are explicit public HTTP routes:
- `/robots.txt` (dynamic route and a static public copy),
- `/sitemap.xml` (dynamic route and a static public copy),
- `/api/public/sitemap.xml`,
- `/api/public/sitemap-pages.xml`.

The generated sitemap should include only existing, useful, canonical public pages. Private/profile/conversation/moderation screens should remain noindex and must still be protected by server-side auth; robots.txt is crawler guidance, not access control.

## Inventory identified in the source tree

| Surface | Source | Review focus |
|---|---|---|
| Public metadata and crawler policy | `src/lib/seo.ts`, `src/routes/robots[.]txt.ts`, `src/routes/sitemap[.]xml.ts`, `src/routes/api/public/*sitemap*` | Canonical URLs, correct content type, origin config, only existing indexable paths |
| Capabilities / service-area inputs | `src/lib/capability.functions.ts` | Auth boundary, writable fields, explicit service scope, freshness |
| Connections | `src/lib/connection.functions.ts`, `src/routes/conversations.tsx` | Do not advertise security guarantees before #162 disposable-database proof |
| Draft assistance | `src/lib/draft-assist.functions.ts` | Auth, content limits, abuse/cost budget, generated text cannot become verified supply |
| Time offers / asks | `src/lib/hours.functions.ts` | Owner checks, visibility, no leaking of location/details to anonymous reads |
| External-data ingestion | `src/lib/ingest.functions.ts`, `src/lib/ingest/*` | Reviewer/cron auth, adapter allow-list, licensing, bounded fetch, deduplication and provenance |
| Journeys | `src/lib/journey-context.functions.ts` | Consent, opt-in, expiry/freshness, explicit journey places not live tracking |
| Locality / canonical place search | `src/lib/locality.functions.ts`, `src/lib/place-index.server.ts` | Canonical IDs, bounded hierarchy reads, no spoofed client coordinates |
| Memories | `src/lib/memories.functions.ts` | Private by design; owner-only reads and writes; never feed discovery or sitemaps |
| Moderation | `src/lib/moderation.functions.ts`, `src/routes/moderation.tsx` | Reviewer-only access, audit trail, escalation and fail-closed errors |
| Needs / matching | `src/lib/needs.functions.ts` | Strict input schema, canonical place read, exact counts, scoped queries, canonical `findSupply()` |
| World / listings | `src/lib/world.functions.ts`, `src/lib/listings.ts` | Public vs private selection, provenance, freshness, bounded pages and error handling |

This table is an inventory of code locations. For each exported action, release review must record exact auth middleware, allowed fields, data-access policies, input schema, output sensitivity and abuse limits. Do not assume a file-level label proves every export is correctly protected.

## Minimal integration contract before external partners

### 1. Stable response and error shapes

Define an internal TypeScript/Zod contract first; do not expose raw database/provider errors. Recommended shape:

```ts
type ApiError = {
  code:
    | "VALIDATION_ERROR"
    | "UNAUTHENTICATED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "RATE_LIMITED"
    | "UPSTREAM_UNAVAILABLE"
    | "INTERNAL_ERROR";
  message: string;       // safe, non-sensitive display text
  requestId: string;     // correlation only; not a secret
  retryable: boolean;
};
```

For public REST endpoints, use a documented status-code mapping and stable schema version. Keep stack traces, SQL errors, auth tokens and provider details in protected diagnostics. Do not turn unknown counts or provider failure into successful empty responses.

### 2. Auth and authorization

- Authenticate at every server action that acts on a user or personal data; repeat owner/role checks at the resource boundary.
- Treat client-side route guards as UX only, not authorization.
- Use canonical IDs; reject extra fields and database-owned columns from write payloads.
- Verify private records in a disposable database using two unrelated users and an anonymous client, including cross-user ID substitution.
- Preserve fail-closed semantics if required block/moderation/auth data cannot be read.

### 3. Rate limiting and abuse controls

Not verified as a complete current capability in this inventory. Before a public integration or broader sign-up:
- limit by user, IP/session and route class with server-side enforcement;
- apply stricter limits to auth, messages/connections, report endpoints, writes, ingestion and AI-provider calls;
- use idempotency keys for retryable create actions where duplicate records would be harmful;
- add request IDs, bounded logs and quota/alert thresholds; avoid logging personal message contents or precise private locations;
- implement source-specific request budgets, timeout, retry/backoff and circuit breaker semantics.

### 4. Versioning / multi-market

- Keep internal TanStack server-function contracts separate from any future public `/api/v1` contract.
- Do not expose database row schemas directly as public API contracts.
- Carry market/country only when explicitly resolved from canonical place context; never infer legal scope from browser locale alone.
- Include source rights, licence/attribution, timestamp/freshness and uncertainty in outward-facing public opportunity payloads.
- Make provider integrations disableable, region-configurable and server-secret-only. No provider credential is added or activated by this document.

## Security / readiness gate

Before describing an external API as ready, produce per-endpoint auth matrix, schema tests, cross-tenant access tests, rate-limit evidence, versioning and deprecation policy, data-retention/privacy review, attribution/rights review, observability runbook and rollback/disable plan. #162 conversation security stays out of limited-beta claims until disposable-database proof exists.
