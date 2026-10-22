# ADR 005: Capacity Planning for the Million-Capable Engineering Target

**Status:** Proposed planning model — not capacity certification  
**Date:** 2026-10-22

## Context

The product’s north star is real-world outcomes, not daily active user (DAU) maximisation. A one-year engineering plan can remove avoidable technical ceilings and demonstrate a measured capacity envelope; it cannot guarantee one million DAU. A short k6 script inspection or low-volume public-read smoke is not evidence of capacity.

There is not yet a representative, measured production workload. The numbers below are assumptions to guide staging design and must be replaced by pilot measurements as soon as trustworthy telemetry exists.

## Planning assumption and arithmetic

Assume **40 API requests per active user-day** solely as an initial sizing constant.

| Metric | Calculation | Planning value |
|---|---|---:|
| Daily API requests at 1M DAU | 1,000,000 × 40 | 40,000,000/day |
| Average request rate | 40,000,000 ÷ 86,400 | ≈463 requests/second |
| Peak envelope | Average × 5–10 | ≈2,300–4,630 requests/second; round design envelope to 2,500–5,000 |
| Cached public-read target | Internal architecture goal | p95 below 300 ms |
| Benchmark error target | Internal architecture goal | below 0.1% errors |

The assumed 40 requests/day, 5–10× burst multiplier, latency target and error target are **not measured results or accepted service-level objectives**. The one-million-DAU label is an engineering design point, not a user-growth forecast.

The API estimate excludes separately budgeted and tested traffic/costs for map tiles, image/CDN delivery, geocoding, routing/public transport, AI/token use, email/push, analytics, external provider APIs, and browser assets. API requests are not equivalent to tile requests, SQL queries, concurrent users, or DAU.

## Workload model to collect

Before any capacity claim, record:

- peak and sustained requests/second, concurrency, read/write ratio, geographic distribution and burstiness;
- payload size, data cardinality/record freshness, pagination, cancellation, cache hit/miss and invalidation delay;
- database query plans, index use, connection-pool saturation, lock/wait time, CPU/memory, replica lag, queue backlog and provider latency;
- p50/p95/p99 latency, status/check failure rate, timeout/retry rate, cost by component and degraded-mode behaviour;
- synthetic dataset size and shape, region, tested SHA/build, exact profile, run operator and spend boundary.

Use only an owner-approved staging environment with synthetic/test data. Confirm runtime, backend isolation, side effects, queues, notifications and shared budgets before generating traffic.

## Proposed staged validation

1. Fix deterministic script inspection; keep `k6 inspect` traffic-free.
2. Run the existing public-read smoke (1 → 3 → 5 VUs) only against an explicitly approved staging origin. This detects obvious route/latency errors; it is not capacity evidence.
3. Add separate synthetic scenarios for discovery/map/search (bounded viewport, pagination, cancellation, realistic locality density), then authenticated owner-scoped reads.
4. Only after authorization and side-effect isolation tests pass, add controlled writes, connection state transitions, idempotency, rate limits, provider failure and recovery scenarios.
5. Increase load stepwise (for example 10 → 25 → 50 → 100 → 250 → 500 VUs, then higher only if justified). Each step must pass the agreed SLOs, headroom and cost/alert checks before the next begins.
6. Run soak/spike/failover/queue-backlog/backup-restore rehearsals on a staging topology that represents production; record capacity bottlenecks, not just VU count.

No traffic test is permitted against production or any unverified host. A hostname containing “staging” is not proof of backend isolation.

## Architecture direction, conditional on measured need

- Start with indexed Postgres/PostGIS, connection pooling, bounded queries, a cache/CDN for public reads, invalidation on publish/update, and idempotent queues for ingestion/media/notifications.
- Use Postgres full-text + geo first; add a dedicated search engine, vector tiles, partitions or read replicas only when load/query data justifies the cost and operational complexity.
- Keep provider abstractions and graceful degradation. Bound model spend by user/IP/market, token budget, per-request limits and kill switch.
- Cache only public, eligible data. Private state, consent and per-user results must never leak through shared caches.

## Cost model (formulas, not invented prices)

- **API:** requests/day × 30 × provider price per 1,000 requests.
- **Maps:** tile requests × tile price + cache misses/CDN egress; compare hosted OSM-derived tiles with self-hosting only after licences/attribution and operations cost are evaluated.
- **AI:** assistant calls × mean input/output tokens × price per million tokens + retries. Include fallback costs and enforce a hard cap.
- **Infrastructure:** database/runtime compute, storage, backups, egress, replicas, queue/workers, logging/tracing and support.
- **Human operations:** moderation coverage per language/market, partner stewardship, incident response and customer support.
- Report **cost per verified useful outcome** and by locality/market, not cost per minute spent in the app.

## Acceptance evidence

Do not call the product “million-DAU ready” until staging test reports on a representative topology meet the modelled envelope with agreed headroom, p95/error budgets are approved, provider/resource failures degrade safely, cost alerts fire correctly, restore/failover drills succeed, and provider-swap/rebuild drills pass. The existing parser CI success is code-verification evidence only and must not be presented as capacity evidence.

## Human gate

The owner and technical reviewer approve the assumed workload, staging topology, spend cap, stop/rollback thresholds and final capacity claim. Real load generation, infrastructure spend, vendor selection and all production changes stay human-gated.
