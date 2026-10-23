# Retention and Funnel Scorecard

**State:** measurement contract, not a claim of current retention performance. No analytics schema or collection change is authorized by this document.

## North-star outcome

**Meaningful voluntary real-world connection completed and confirmed**, with privacy-preserving evidence from participants where appropriate. The product succeeds when someone finds eligible local value, acts by choice, and a need is met / offer is fulfilled / knowledge is shared—not when they keep scrolling.

## Funnel definitions

| Stage | Event definition | Denominator / guard |
|---|---|---|
| Impression | A page or eligible map result actually rendered, not a crawler request or sitemap fetch | Separate likely bots/crawlers; don't count a server request alone as a human impression |
| Click | User deliberately opens an eligible result | Only valid session events under consent policy |
| First local value | User receives one eligible, place-scoped result they can reasonably act on | Exclude demo, stale, private or unauthorized records |
| Account / install | Account creation or install completes and is attributable under consent policy | Keep anonymous browsing distinct; no forced account wall for public information |
| Voluntary action | User saves, responds, offers help or posts a need with an explicit intent | No inferred intent from dwell, location or background behavior |
| Agreed exchange | Participants confirm a mutual plan or acknowledgement | Don't equate a click/message with an agreement |
| Completed outcome | Need met, offer fulfilled, task completed, or knowledge-transfer feedback explicitly recorded | Report numerator/eligible denominator, missingness and response rate |
| Return | A consent-eligible person returns at day 1 / 7 / 30 / 90 and performs a meaningful action | Publish cohort size and missingness; distinguish retained humans from crawlers and retries |

## Required breakdowns

- Geography at a privacy-appropriate coarse level (country/region/place aggregate only where disclosure risk is acceptable).
- User mode (local/traveler) only if voluntarily selected and necessary.
- Locale/language, accessibility path, device/network class only where collected lawfully and with minimum data.
- Acquisition source and eligible content freshness.
- Need category and completion type only in aggregate, with small-cell suppression.

## Reporting rules

- Every rate includes numerator, denominator, reporting window, event-coverage estimate, bot-filter method, missingness and uncertainty.
- Suppress small cells; do not report individual users' locations, need outcomes, travel patterns or inferred states.
- Do not infer age, vulnerability, loneliness, mental state, socioeconomic status, or personal habits from passive behavior.
- No background location for retention nudges, no private messages/contact scraping, no tracking pixel across unrelated services.
- Consent, purpose limitation, retention/deletion policy, processor/vendor and regional-law review precede analytics activation.
- HCR-7 and other unvalidated scores are not outcomes and may not support causal claims; if ever explored, publish their validation limits, numerator/denominator, response rate and opt-in bias.
- Never optimize for time spent, notification opens, streaks, fear-of-missing-out or daily visits absent real-world utility.

## Launch scorecard — all currently UNKNOWN / NOT VERIFIED

| Metric | Status | Evidence required |
|---|---|---|
| Human vs bot/crawler separation | UNKNOWN | Consent-reviewed instrumentation and classification validation |
| Landing → first eligible local value | UNKNOWN | Event definitions and real funnel data |
| Day-1 / day-7 / day-30 / day-90 retention | UNKNOWN | Mature cohorts, denominator and missingness report |
| Need response/completion rate | UNKNOWN | Voluntary confirmation from relevant participants |
| Offer fulfillment / time to completion | UNKNOWN | Clear lifecycle timestamps and confirmed status transitions |
| Safety/report/dispute rate | UNKNOWN | Defined eligible activity denominator and review process |
| Sparse-village parity | UNKNOWN | Pilot evidence across a village, town and city; no inference from city-only traffic |
| Accessibility/low-bandwidth success | NOT RUN | Manual keyboard, screen-reader, mobile and throttled-network QA |
| Unit cost per confirmed outcome | UNKNOWN | Approved cost attribution and measured successful outcomes |

No acquisition spend or retention nudges until instrumentation, consent, real human baseline and safety review pass.
