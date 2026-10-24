# Global Geographic Discovery, Search Intent and Retention Architecture

**Status:** architecture-only; public page generation, public sitemap expansion, external search-provider calls and retention nudges remain disabled until security, identity, privacy and owner gates close.

## 1. Architecture principles

- Every generated surface is based on a canonical place and current eligible records, not the mere existence of a geographic name.
- A place page is a calm entrance to the canonical live map, not a thin doorway page or a second discovery database.
- Search discovery and AI answer-engine citations must point to public, lawful, current and explainable records.
- Supply eligibility, locality authorization and privacy outrank index coverage or growth.
- The pipeline can run repeatedly, but only a genuinely durable, monitored worker can be described as 24/7.
- A search query signal is evidence about intent, not proof that local supply exists or that a user wants an automated message.

## 2. Canonical data flow

1. **Place registry:** canonical hierarchical place ID, parent, kind, validated slug, country/locale and stable URL. Use existing place index and shared route policy.
2. **Eligible record scan:** bounded, deterministic enumeration of public/published, current records with provenance and rights; exclude demonstration, private, reported, blocked, unreviewed and restricted rows.
3. **Indexability decision:** reuse the current route/indexability policy. The current locality evaluator requires at least three genuine records and checks completeness, freshness and provenance. Do not lower or fork this threshold without a reviewed ADR.
4. **Page assembly:** render specific locality facts, eligible record summaries, map entry point, last-checked context and honest quiet state. Every claim must refer to a source record or identified canonical place field.
5. **Structured metadata:** use schema.org types only when factual fields are present and accurate. Never fabricate address, hours, reviews, ratings, attendance, availability, price, credential, event or relationship.
6. **Canonical and internal links:** stable locale-aware canonical URL, consistent parent/child links, related public listing pages, and a direct way to open the same locality in the map.
7. **Sitemap output:** bounded shards with deterministic order; use only canonical indexable URLs. Check exact counts and source-scan completeness. Missing counts, cap hits, read errors or inconsistent enumeration fail closed for that run.
8. **Live verification:** on the owner-confirmed host/build, GET robots.txt, the sitemap index, every child sitemap, representative indexable pages and private routes. Compare output to source policy after every authorized release.

## 3. Unique local content contract

A page may index only when it has a real, supportable local value proposition. Use the record types actually present in that place: current offers, needs, eligible listings, local knowledge or confirmed public activity. If there is no eligible activity, keep the page unindexed or show a restrained no-index quiet-state page according to route policy. Do not add generic “best things to do” paragraphs to reach word count.

Each page records internally:
- canonical place ID and canonical URL;
- language/locale and content version;
- eligible source record IDs and their provenance/rights status;
- last successful complete source-scan time;
- freshness and moderation policy version;
- title/description generation version;
- human/local reviewer and review timestamp when required;
- exact indexability decision and reason.

Never publish private user profiles, messages, saved places, restricted needs, exact live-person coordinates or individual-level outcomes.

## 4. Sitemap and SEO safety

- Build sitemap URLs from the same route-policy/indexability registry as the page. Never maintain separate hand-written public route lists that diverge.
- A completed scan may be marked complete only when the source count and deterministic cursor/keyset scan prove completeness within the configured cap. Where the source cannot guarantee snapshot isolation, document that limitation; do not claim strict snapshot consistency.
- Enforce URL normalization, HTTPS origin allowlist, trailing query/fragment rejection, no duplicate URLs, no private routes, canonical-only paths, XML escaping and per-sitemap URL/byte limits.
- Do not derive lastmod from the current time; use true source modification or omit lastmod.
- robots.txt is crawler guidance, not authorization. Private-route protection is server-side access control plus noindex metadata.
- Any sitemap generation failure must be visible to monitoring and must not publish a successful-looking partial sitemap.

## 5. Search-intent research pipeline (design until authorized)

### Inputs
Use permitted, lawfully accessible public data: documented public keyword reports, trend snapshots, official local-service categories, public-language resources, publicly accessible community information and voluntary research. For each input retain source URL, publisher, source publication date, retrieval timestamp, geography, language, measurement method, licensing/terms and confidence.

### Intent record
Each proposed intent item contains:
- canonical place ID or explicitly unresolved geography;
- source query / translated variant as allowed by source terms;
- language/script and regional variant;
- category and seasonal window where supported;
- evidence type: directly observed, third-party report, hypothesis, unknown, or interview-required;
- source URL, publisher, published date, retrieval time and method;
- confidence rationale, known bias, missingness and rights/use restrictions;
- linked eligible supply IDs, if any, without treating the link as proof of demand.

Do not invent search volumes, AI-answer rankings or query frequencies. Do not scrape private account analytics or personal conversation history. Do not bypass provider controls, create accounts, purchase data or incur paid-provider cost without explicit owner authorization.

### Search engines and answer engines
Classic SEO research may use public documentation, permitted query reporting, and lawful public results across relevant engines/languages. AI-answer-engine research must be source-backed and repeatable; do not imply access to private ranking systems or quote generated answers as factual local evidence. Distinguish engine-generated output from authoritative records and log only necessary, lawfully obtained evidence.

### Prioritization
Use real observed intent plus eligible supply, not volume alone. A large query count with no eligible, safe supply may become an interview question or supply gap, never a fabricated page. Prioritise underserved ordinary places only where real local relevance can be demonstrated.

## 6. Content and local stewardship workflow

Research proposal → source/rights review → eligible-supply check → language/cultural review → duplication/thin-content review → owner/steward review if required → indexability evaluation → publication approval → post-release GET verification.

Local stewards can flag inaccurate descriptions, suppress sensitive community details and request review. Their authority and appeals path must be designed before the role is activated. AI may draft text from approved facts but cannot auto-publish or invent availability.

## 7. Consent-first funnel and non-addictive retention

Minimal funnel:
- landing / referral source;
- map opened;
- eligible local value shown;
- voluntary detail/action;
- response/agreement;
- human-confirmed outcome;
- return to meaningful action at day 1 / 7 / 30 / 90.

Count bots/crawlers separately; sitemap downloads are not human acquisition. Record numerator, denominator, event coverage, cohort size, missingness, opt-in bias and small-cell suppression. Avoid cross-site tracking, precise background location, private message mining and inferred vulnerability.

Retention options (design only) are user-controlled weekly digests, explicit saved-place updates and optional contribution prompts, each with frequency caps, clear reasons, no urgency, easy opt-out, stale-data checks and no message when there is no eligible new value. “Your place is alive” may not imply activity if the only evidence is crawler traffic or stale content.

Success is confirmed mutual aid, fulfilled offers, useful knowledge transfer, safety and repeat voluntary utility. Dwell time, app opens and notification clicks are diagnostic, not the north-star outcome.

## 8. Incremental operation and cost bounds

- Recompute only when canonical source records, place hierarchy, locale content or policy versions change.
- Use deduplication keys, bounded batches, per-place/page rate limits, timeouts, cancellation, retry budgets and a dead-letter state.
- Cache only public eligible output and invalidate it on privacy, moderation, status, freshness, rights or locality changes.
- Monitor scan completeness, page freshness, duplicate/thin-page rate, sitemap errors, indexability denials, request latency, cost and rollback state.
- Store provenance and deterministic outputs to make each run auditable.
- No autonomous public page publisher, external provider spend, outbound contact or production write until the relevant approval and durable worker gates pass.

## 9. Rollout dependencies

1. Gate 0 identity and Gate 4 privacy/least privilege.
2. Governance/deletion protection and exact-head security reviews.
3. Confirmed host/build, authorized SEO parity correction and GET-only live proof.
4. Complete Live Map/list/need read-write integrity and accessibility.
5. Approved consent/privacy analytics and a verified locality pilot.
6. Local page and sitemap canary in a disposable/staging environment with real synthetic records.
7. One locality at a time, with local review and confirmed outcomes.
8. Durable worker acceptance and grounded AI evaluations remain separate; neither is implied by a search pipeline or scheduled task.
