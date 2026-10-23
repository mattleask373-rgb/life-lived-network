# ADR 005: Capacity Planning for the Million-Capable Engineering Target

**Status:** Proposed planning model — not capacity certification  
**Updated:** 2026-10-23  
**Reviewed source baseline:** `main` at `a3e57da647144fdd298590adc0e1e36269a979fd`

## Purpose and non-claim

Real World Atlas should optimise for verified useful real-world outcomes, not raw daily active user (DAU) volume. This ADR is an engineering sizing model only. It does not certify a one-million-DAU capacity, predict growth or state an accepted service-level objective.

There is no representative measured workload from an approved staging environment. No load traffic was generated during this review. The current main Verify workflow only parses the k6 profile with `k6 inspect`; that is syntax validation, not a load test.

## Provisional planning arithmetic

Use **40 API requests per active user-day** solely as an initial sizing assumption.

| Metric | Calculation | Illustrative planning value |
|---|---|---:|
| API requests/day at 1M DAU | 1,000,000 × 40 | 40,000,000 |
| Average API request rate | 40,000,000 ÷ 86,400 | ≈463 requests/second |
| Illustrative peak multiplier | average × 5–10 | ≈2,300–4,630 requests/second |
| Rounded planning envelope | engineering design placeholder | 2,500–5,000 requests/second |
| Cached public-read latency | proposed target only | p95 below 300 ms |
| Benchmark error rate | proposed target only | below 0.1% |

All values above are assumptions, not measured throughput, accepted SLOs or budget commitments. API requests are not equivalent to tile requests, SQL queries, concurrent users or DAU.

Separately measure and budget map/tile delivery, images/CDN, geocoding, routing/transit, AI tokens, email/push, analytics, external source APIs, database, runtime compute, egress, queues and human operations.

## Workload evidence required

For each benchmark, record exact build SHA, environment/region, dataset shape, concurrency and request profile; sustained and peak RPS; read/write mix; payload size; locality density; cursor/page behavior; cache hit/miss and invalidation; database query plans and index use; connection/lock saturation; queue backlog; provider latency/failure; p50/p95/p99; timeouts/retries; resource usage; cost; alert delivery; and rollback/recovery result.

## Staged testing protocol

1. Keep script parsing traffic-free.
2. Confirm canonical host, runtime and a named staging origin; prove backend, queues, notifications, data and provider-budget isolation first.
3. Use synthetic data and start with low-intensity public-read profiles. Increase only when all previous profiles meet independently agreed error, latency, headroom, cost and alert thresholds.
4. Add separate locality discovery/map/search cases (bounded viewport, pagination, cancellation, realistic density) and authenticated owner-scoped reads.
5. Add controlled writes, connection state transitions, rate limits, idempotency, provider failure and recovery only after authorization and side-effect isolation tests pass.
6. Perform soak/spike/failover/backlog/restore drills on representative staging topology. Record bottlenecks, not just virtual-user counts.

No traffic testing is permitted against production or an unverified hostname. A hostname containing “staging” is not proof of isolation.

## Architecture direction, conditional on data

Start with indexed Postgres/PostGIS, connection pooling, bounded reads/writes, public-read caching with safe invalidation, and idempotent queues for ingestion/media/notifications. Add a dedicated search engine, vector tiles, partitions or read replicas only when measured query/load data justifies the cost and operational complexity.

Keep public/private cache boundaries explicit. Keep provider calls behind adapters, degrade safely when external services fail, and enforce rate limits, request/token budgets, a hard cost cap, operator alerts and a kill switch.

## Cost model (formulas, not invented prices)

- API: requests/day × 30 × provider price per 1,000 requests.
- Maps: tile requests × tile price + cache misses/CDN egress.
- AI: assistant calls × mean input/output tokens × price per million tokens + retry/fallback cost.
- Infrastructure: compute, database, storage, backups, egress, replicas, queues, logging/tracing and support.
- Operations: moderation coverage per language/market, local stewardship, incident response and customer support.

Report cost per verified useful outcome and by locality/market, not time spent in the app.

## Acceptance criteria

Do not call the product “million-DAU ready” until representative staging reports meet a reviewed workload envelope with headroom; p95/error targets are approved; provider/resource failures degrade safely; cost alerts fire; restore/failover drills succeed; and rebuild/provider-swap tests pass. A k6 parser pass, public smoke, sitemap traffic or analytics pageviews are not capacity evidence.

## Human gate

The owner and technical reviewer approve workload assumptions, staging topology, spend cap, stop/rollback thresholds and any final capacity statement. Real load, infrastructure spend, vendor selection and production changes stay human-gated.
