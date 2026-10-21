# Staging-only public-read load smoke test

**Status:** starter harness; not a capacity certification.  
**Related work:** [Issue #45 — Scale, Reliability + Observability](https://github.com/mattleask373-rgb/life-lived-network/issues/45).  
**Safety boundary:** public GET requests only; no credentials, user data, writes, migrations, deployment or production configuration changes.

## Purpose

The repository's standard verification workflow runs dependency installation, lint, unit tests and a build. Those are valuable correctness gates, but they do not create representative concurrent traffic or measure a deployed runtime's response under load.

This deliberately small first step provides a reproducible staging smoke test for the app document and crawler-facing routes. It helps identify deployment/routing failures and obvious latency/error regressions before a more representative test is designed.

It is **not** evidence that the app can support 10×, 100×, 1,000× or billion-user traffic. It does not exercise authenticated workflows, database-heavy matching, writes, payments, moderation, external feeds or realistic geographic/data distributions.

## Mandatory pre-run gates

A human operator must first:

1. Confirm the exact staging hostname, deployed commit, runtime and Supabase environment in the hosting dashboards. A hostname label alone does not prove its backend is isolated.
2. Ensure staging uses synthetic/test data and cannot trigger notifications, payments, provider refreshes or other production side effects.
3. Approve the target and run window, confirm current provider/hosting limits, and ensure someone is available to stop the run.
4. Confirm no production users share a constrained database, worker pool or rate budget with the target.
5. Capture the current commit, environment/region, data volume, test operator and run output with the results.

Do not run against the canonical production host, life-lived-network.lovable.app, or any production hostname. The script blocks that known production host, refuses to run without an explicit approval phrase, accepts only a labelled staging/preview/test/QA/performance hostname in staging mode, and disables redirect following so a redirect cannot relay test traffic to another origin. These guards are defence-in-depth, not a substitute for verifying the hosting topology.

## Run

Install the official k6 CLI in your local/test environment separately; this change does not add a new runtime dependency to the application.

For an approved HTTPS staging host:

~~~sh
LOAD_TEST_ENV=staging \
LOAD_TEST_BASE_URL=https://preview.staging.example.invalid \
LOAD_TEST_APPROVED=YES_I_APPROVE_STAGING_LOAD \
k6 run tests/load/staging-public-read.js
~~~

Replace the example hostname with the exact owner-approved staging origin. The sample .invalid hostname is intentionally non-routable.

For a local development server, use only localhost or 127.0.0.1 and set LOAD_TEST_ENV=local. The same explicit approval phrase is required.

The test is intentionally bounded to 1, then 3, then 5 virtual users over about 80 seconds, with at least one second of think time between requests. It issues only GETs to:

- / — app document, expected HTML;
- /robots.txt — crawler instructions, expected plain text;
- /sitemap.xml — sitemap endpoint, expected XML.

Redirects are not followed. Missing routes, HTTP errors, unexpected content types, a failed-request rate above 1%, or p95 latency at/above 1.5 seconds should fail the initial smoke thresholds. Those numbers are provisional regression tripwires, not signed-off service-level objectives; refine them after collecting baselines in the actual staging region.

## Results to record

For every run, store the k6 summary together with the tested origin, commit/build ID, region, test profile, dataset size, approximate request rate, p50/p95/p99 latency, failed-request rate, HTTP status/content-type checks, resource saturation and observed cost. Keep the report free of personal data and secrets.

A passing run means only that this specific public-read smoke profile passed those provisional checks against that target at that moment. It does not prove availability, redundancy, recovery, security, source freshness, user retention, production configuration or capacity for much larger loads.

## Scale-test progression

Do not automatically increase traffic. After the baseline is stable, design separate, reviewed scenarios for:

1. Read-only route and public discovery at an approved staging load.
2. Realistic locality/map search with synthetic data, realistic bounds, pagination and cancellation.
3. Authentication and owner-scoped flows with dedicated test identities.
4. Controlled write/connection/need flows, idempotency and abuse limits, only after side-effect isolation is proven.
5. Sustained, spike, soak, dependency-failure and recovery tests in a staging topology representative of production.

Increase traffic in explicit steps (for example 10 → 25 → 50 → 100 → 250 → 500 virtual users) only after the prior run meets its SLOs, the resource graphs are reviewed, error and cost budgets are known, and an owner approves the next step. VUs are not equivalent to daily active users; workloads, think time, caching, request mix and peakiness determine the relationship.

Before claiming million- or billion-user readiness, the team must establish realistic daily and peak request models, tested capacity ceilings, p95/p99 SLOs, graceful degradation, database/connection capacity, rate limiting, cache correctness, observability, budget limits, backup/restore evidence, incident ownership and regional/legal constraints. Use synthetic data and isolated environments. Never use production as a load-test target by default.

## Known limitations

- No run has been performed by this change; no staging target or hosting topology has been confirmed.
- The ordinary CI workflow does not install k6 or execute this scenario.
- A staging label does not verify that the host is isolated from production.
- /robots.txt and /sitemap.xml must be verified at the selected staging host, not assumed from source code.
- The script intentionally stays small; it is not an end-to-end benchmark, a security test, or a billion-user capacity claim.
