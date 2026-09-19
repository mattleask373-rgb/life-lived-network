# The Living World — Final Product Hardening

## Goal
Turn the existing application into one reliable, coherent release without redesigning it or adding deferred provider-dependent features. Preserve the canonical geography, discovery, matching, connection, journey, Road Trip, provenance, privacy and moderation systems.

## Audit findings to resolve
- All current routes load on desktop and mobile with one main region, no console/page errors and no horizontal overflow.
- The map currently preserves viewport independence, pan, zoom, clustering and explicit area adoption, but the visible “Explore this area” action is missing; adopting an area is the only available viewport action.
- Road Trip evidence, duplicate-safe journey building, reordering, removal, recalculation and versioned local persistence are implemented and tested.
- Authentication exists, but a failed session lookup can leave account-dependent pages waiting indefinitely; signed-out header wording is unclear.
- Several major reads lack a visible recoverable error state. Some protected pages briefly render empty while authentication resolves.
- The entry detail dialog supports Escape but lacks complete focus containment/restoration.
- The longer-stay journey selector hard-codes pounds even when viewing an Irish or Portuguese locality.
- Lint is currently obscured by formatting drift; the standard test command is missing.
- No routing, public-transport or Ticketmaster credential is configured. Those integrations must remain transparently unavailable. Development fixtures are already excluded from production unless explicitly enabled and are visibly labelled when present.
- Existing report-review RLS is correctly reviewer-only. No new database model or weaker policy is needed.

## 1. Reliability, state and security hardening
- Make session restoration resolve to a usable signed-out/error state instead of hanging, and show an honest retryable message where account state cannot be checked.
- Make the header account action reflect signed-in versus signed-out state without exposing private data.
- Add consistent loading, quiet, error and retry states to core world, Needs, hours, conversations, profile, source and moderation reads where absent.
- Keep user-facing failures generic while retaining existing server-side diagnostics.
- Make Road Trip browser persistence storage-safe, preserve ordered canonical IDs, and keep retained stop snapshots in the local draft so refresh can restore a selected stop even when current discovery no longer returns it. Version the change and safely ignore/migrate old or malformed drafts.
- Confirm no secret-bearing configuration is added to client code. Keep provider access server-only and keep unavailable providers disabled.

## 2. Coherent product and interaction polish
- Restore two distinct map actions: “Explore this area” changes only the transient viewed results; “Make this my area” explicitly persists locality. Panning alone changes neither. Add clear loading, quiet and failure overlays without replacing the current map/corridor logic.
- Clarify the first screen with one concise product promise and direct actions into map exploration and Road Trip, while keeping the locality hub and existing content below.
- Standardise primary controls around the existing design-system Button and form primitives where changes are made; maintain the warm visual language rather than redesigning screens.
- Replace raw/internal errors and temporary wording with calm human messages. Keep demonstration records explicitly labelled and never imply they are real.
- Improve the entry detail sheet with proper focus entry, containment, Escape, backdrop close, restoration, responsive sizing, broken-image fallback and suppression of empty metadata.
- Fix locality-aware currency and date presentation, long-content wrapping, mobile tap targets and mobile navigation clarity.
- Remove genuine dead/debug code and temporary artefacts only after confirming they are unused. Preserve legitimate development fixtures and internal reviewer diagnostics.

## 3. Verification and release gate
- Add focused tests for map viewport versus explored versus adopted locality; auth failure completion; loading/error/empty states; dialog keyboard behavior; Road Trip snapshot restoration, duplicate prevention, ordering, removal and recalculation; evidence/freshness omission; and locality-aware currency.
- Add a standard test script, clear actionable lint failures and keep generated/integration-managed files untouched.
- Run focused tests, full Vitest suite, TypeScript check, lint and production build; fix failures rather than suppressing them.
- Browser-walk every route at desktop, tablet, mobile portrait and mobile landscape sizes. Check console/page errors, overflow, primary links, forms, detail sheets and protected-page states.
- Run the complete investor path: understand product → map pan/zoom → explore without adoption → explicit adoption → Road Trip inputs → multiple interests → inspect evidence/detail → add duplicate-safe stops → reorder/remove → recalculate preserving order → refresh and restore.
- Test authenticated sign-in/session/sign-out and protected routes using the managed test session if available. Do not claim sign-up email delivery, Google OAuth or multi-user connection delivery unless those external flows can actually be completed.
- Run the existing security scan and inspect the newest build/runtime signals before release reporting.

## Explicitly deferred
- Real routing, driving distance/time, precise detours and route optimisation.
- Public-transport provider integration.
- Ticketmaster/live-event refresh requiring credentials.
- Lift-sharing and shared journeys.
- Genuine Guildhall information and booking until supplied by the organisation.
- New analytics infrastructure; existing diagnostics will be preserved without adding invasive tracking.

## Completion report
Report only checks actually performed, grouped as Completed, Verified, Integrations, Deferred, Known limitations and Release readiness. Deployment readiness will be distinguished from publishing; publishing will not occur unless explicitly requested.
