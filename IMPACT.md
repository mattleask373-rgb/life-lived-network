# Impact Framework — Real World Atlas / Life-Lived Network

**State:** measurement definition only. No live impact baseline, pilot outcome, retention rate, or global coverage claim is asserted.

## Intended human outcomes

1. A real need is answered by a consenting and appropriately eligible person.
2. An offered skill, hour, tool, place or piece of knowledge is actually used.
3. A person discovers a useful local activity without pressure to stay online.
4. A local community retains control over its knowledge, visibility and stewardship.
5. A traveler can participate in a way that locals welcome, rather than extract value and disappear.
6. Core mutual aid remains free.

## Outcome ladder

| Stage | Evidence accepted | Not sufficient |
|---|---|---|
| Recorded supply or need | Human-created, current, eligible record with provenance and visibility scope | Demo fixture, imported raw provider response, unreviewed or stale item |
| Discovery | User is authorized to see the record and it is rendered | Sitemap hit, crawler request or unscoped query |
| Response | Recipient/owner explicitly records a relevant response | Pageview, save, click or generated AI answer |
| Agreement | Participants explicitly acknowledge a plan | Message count or a model inference |
| Completion | Appropriate participant confirmation or a documented workflow state supported by evidence | Expired record, unverified status or assumed completion after a timer |
| Durable usefulness | Repeated voluntary successful outcomes across a mature observation window | Dwell time, notification open, daily streak or a single anecdote |

## Measurement principles

- Report source, observation window, numerator, denominator, response rate, missingness and confidence/uncertainty.
- Distinguish records from eligible supply, and eligible supply from real human availability.
- A missing completion confirmation is UNKNOWN, not FAILED or SUCCESS.
- Do not publish identifiable individual histories, exact sensitive localities, or small cells that allow re-identification.
- Do not infer a person's mental state, vulnerability, loneliness, age, or life circumstances from behavior or private communications.
- HCR-7 is unvalidated; it may not be treated as a production KPI or causal outcome. Any future study must state validation status, opt-in/response bias, numerator/denominator and missingness.
- Qualitative stories require participant consent and removal of identifying detail.
- Compare dense cities and sparse villages; do not treat lower raw counts in a village as worse impact without population, coverage and response context.

## Baseline status

As of this repository snapshot, the following are UNKNOWN or NOT VERIFIED: completed needs, fulfilled offers, hours of mutual aid, knowledge-transfer events, human DAU, day-7/day-30/day-90 retention, safety/dispute rates, and outcomes per unit cost.

## Gates before instrumentation

1. Approve lawful purpose, consent UX, event retention/deletion, processor/vendor posture and geographic scope.
2. Define bot/crawler filtering and test it against known sitemap and automated-smoke traffic.
3. Minimize event fields and suppress small cells.
4. Verify the same locality and authorization rules used by the core product.
5. Have a human owner review the dashboards, access roles and response procedure.
6. Do not enable acquisition spend or push notifications until real human conversion and safety are measurable.
