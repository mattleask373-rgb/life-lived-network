# Global launch readiness plan — 31 October 2026

**Status:** Proposed execution plan on a feature branch. Planning artifact only; no production changes, migrations, secrets, deployments, or merges performed.
**Window:** 19–31 October 2026.
**Product:** Real World Atlas / Life Lived Network — canonical naming decision required before launch.

## Launch definition

Aim for a **credible, safe, tightly scoped public pilot by 31 October**, not a claim that a brand-new network is fully operational worldwide. A global-ready architecture and a worldwide live inventory are different things. Launch only in localities where supply, safety operations, and support are genuinely ready; expand by locality using measurable gates.

North star: help people turn real-world intentions into real-world activity. Do not optimise for endless feed consumption, fabricate supply, imply availability from capability, or expose people's live/exact location without explicit consent.

## Repository evidence and constraints

Read-only review of the connected GitHub repository on `main` found:

- Primary candidate: [mattleask373-rgb/life-lived-network](https://github.com/mattleask373-rgb/life-lived-network). A second near-duplicate, `life-lived-network2`, exists; confirm which is canonical before implementation work is split across repositories.
- Existing product foundation includes a living map and locality discovery, needs, offers/contributions, profile/auth, connections, saved items, journeys/Road Trip, provenance/freshness concepts, and the canonical `src/lib/supply-engine.ts`.
- Stack includes React 19, TanStack Start, Vite, Tailwind, Supabase, React Query, Vitest and ESLint. The package exposes build/test/lint scripts; CI and lockfile/format drift have been noted in repository status.
- The product audit dated 8 October reports 221 localities but zero people, listings, or needs in its last observed database check; verify live data before using this as a current metric. It identifies the empty-locality experience and real supply acquisition as core launch risks.
- Existing planning docs report missing provider credentials for live Ticketmaster events and route/public-transport integrations. Do not make those integrations launch blockers unless the launch promise depends on them; display honest unavailable states.
- The repository's agent instructions explicitly prohibit autonomous merge to main and require independent review. Keep this work on a feature branch and open a PR for review.

## Release priorities

### P0 — must pass before any public pilot

1. **Choose the canonical product/repository.** Resolve Real World Atlas vs The Living World naming across title, logo, domain, app copy, privacy/terms, social handles and investor materials. Do not merge duplicate repositories.
2. **Prove the critical user journey end to end:** visit locality → understand real possibilities → inspect source/freshness/trust → ask/offer/post → request connection → receive/respond → mark outcome. Include signed-out, signed-in, empty, loading, failure and retry states.
3. **Trust and safety operations:** report listing/user, block user, reviewer queue, moderation action/audit trail, abuse/spam rate limits, account deletion/contact route, clear emergency disclaimer, and escalation owner. Verify existing implementations before building anything new.
4. **Protect people and opportunity seekers:** consent-based discoverability; never reveal exact personal location; do not treat “can do” as “available”; show pay, hours, dates, accommodation, duties, conditions and host expectations explicitly for work/exchange listings. Gate high-risk or regulated listing categories by region.
5. **Privacy/security release review:** inspect Supabase RLS and policies, auth/session failure paths, server/client secret boundaries, storage access, input validation, rate limits, logs and data retention. No credentials in browser bundles. Test owner-only/private data with separate test accounts.
6. **Release verification:** run clean install, typecheck (if configured), unit tests, lint, production build, migrations/RLS checks, browser route walkthrough and mobile viewport pass. Record actual outcomes; never describe an unrun check as passed.
7. **Real inventory:** recruit and manually validate an initial cohort of hosts, venues, community organisers, local contributors and opportunity publishers. No fabricated demo records in production. If a locality is quiet, say so and provide a useful contribution action.

### P1 — high-value if P0 is green

- Simplify primary navigation around **Explore / Ask or offer / Messages / You**, retaining journeys as a clear secondary entry.
- Make listing trust information visible before connection: publisher, source, last verified/updated date, status, payment/exchange terms, and what remains unknown.
- Fix first-visit empty states so a quiet place has a polished explanation, nearby expansion, and a one-step contribution path.
- Build a compact host/provider onboarding checklist and reviewer checklist.
- Add only lightweight, privacy-conscious launch metrics: activated contributors, verified live listings, enquiry response rate, accepted connections, completed real-world outcomes, reports per active user, and time-to-resolution. Avoid invasive tracking.
- Prepare investor evidence: architecture diagram, feature inventory, known limitations, security checklist, test report, locality pilot metrics, unit economics assumptions, roadmap and explicit dependencies.

### P2 — defer unless already complete and verified

- Worldwide real-time event ingestion, global transport routing, complex booking/payments, shared journeys, AI autonomous actions, and broad multi-region marketplace operations.
- New feed mechanics, vanity counters, or features that do not improve successful real-world outcomes.
- Any feature that requires unconfigured provider credentials or legal/operational guarantees the team cannot currently support.

## 12-day execution schedule

| Date | Outcome | Acceptance evidence |
|---|---|---|
| 19 Oct | Confirm canonical repo/product; freeze scope; capture baseline | Written decision, current main SHA, route/feature inventory |
| 20 Oct | Run app/build/test/security baseline; reproduce failures | CI results, bug list ranked P0/P1/P2 |
| 21–22 Oct | Close critical auth, session, error/empty-state and core journey defects | Tests for each fix; browser walkthrough |
| 23–24 Oct | Safety/privacy review; report/block/moderation and RLS gaps | Signed-off checklist and reproducible access-control tests |
| 25–26 Oct | Seed and verify real launch-locality supply; host/provider onboarding | Named owners, live listing count and validation status |
| 27 Oct | Mobile/accessibility/usability pass; first-visit and locality polish | Device/viewport checklist and resolved critical issues |
| 28 Oct | Release candidate; clean build and end-to-end regression | Green required checks; no open P0 defects |
| 29 Oct | Small invited pilot; support and incident rehearsal | Feedback log, response ownership, rollback plan |
| 30 Oct | Fix only release-blocking findings; independent review | Reviewed PR(s), release checklist |
| 31 Oct | Go/no-go; staged pilot only if gates pass | Decision log, known limitations, monitored rollout |

Dates are targets, not a promise of completion. If a P0 fails, reduce launch scope rather than bypassing safety or quality gates.

## Competitor-derived product principles

Use comparable services as references for trust patterns, not as templates to copy:

- Airbnb's published guidance emphasises identity verification, accurate listings, disclosed safety hazards, reliable communication and compliance with local rules.
- Workaway describes manual review of profiles, optional ID verification, reporting, support and clear expectations.
- WWOOF asks hosts to describe activities, duration, accommodation, seasons and transport, and emphasises explicit discussion of expectations and insurance.

For Atlas, translate these into visible verification states, transparent listing conditions, two-way reviews after real activity, reporting/blocking, and clear boundaries between paid work, volunteering, learning exchanges and hospitality. Verification badges must state exactly what was checked; they are not a guarantee of safety.

## Go/no-go gates

**GO only if all are true:**
- Canonical repository and public product name are settled.
- No known critical auth, data-leak, payment, or location-privacy defects.
- Core discovery-to-contact path works with real data and useful error/empty states.
- Reporting, blocking, moderation ownership and user support are operational.
- Public listings are real, current, permissioned and accurately described.
- Production build and required automated/manual checks pass on the release candidate.
- Terms, privacy notice, consent, retention, and regional work/volunteer rules have been reviewed by qualified owners for the launch jurisdiction.
- Rollback and incident-response contacts are available.

Otherwise: **NO-GO for broad public launch**; continue an invite-only pilot or demo with clearly labelled sample data.

## Research references

- Airbnb identity verification: https://www.airbnb.co.uk/help/article/1237
- Airbnb host standards: https://www.airbnb.co.uk/help/article/3057
- Workaway safety and trust: https://www.workaway.info/en/info/safety
- Workaway ID verification: https://www.workaway.info/en/info/safety/idverification
- WWOOF host onboarding: https://help.wwoof.net/hc/en-us/articles/16654245845661-How-do-I-become-a-host
- European Commission Digital Services Act overview: https://commission.europa.eu/news-and-media/news/two-years-digital-services-act-ensuring-safer-online-spaces-2026-02-17_en

## Immediate next actions

1. Product owner confirms canonical repository and product name.
2. Engineering owner runs the baseline build/test/lint/typecheck and verifies the current live database counts.
3. Safety/privacy owner reviews current implementation against the P0 checklist.
4. Growth/operations owner confirms the first pilot locality and secures real, reviewed supply.
5. Every implementation change stays in a scoped branch/PR; no autonomous merge or production deployment.
