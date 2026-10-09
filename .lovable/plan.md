# Discovery readout: ethical local-business visibility and enquiry pilot

This is read-only. No files, packages, schema, data, secrets or deployments changed. No tests were run in this turn.

## 1. Source of truth and the duplicate repository
- VERIFIED: This sandbox can only see this project's Lovable-managed git remotes (origin plus a secondary). Neither one is a GitHub URL.
- VERIFIED: The name `life-lived-network2` appears nowhere in this repository.
- BLOCKED: I can only see this repo, so I cannot compare it with `life-lived-network2`. A human needs to confirm which GitHub repo is linked (+ > GitHub) and freeze or archive the other one.
- Risk: if two repos both receive pushes, they drift apart and make conflicting claims about what is canonical (ADR 001, AGENTS.md).
- The backend is still the Lovable Cloud project bound in `.env` and `supabase/config.toml`. The open A/B/C backend decision is unchanged.

## 2. Canonical engine and journeys
- VERIFIED: `src/lib/supply-engine.ts` (612 lines) exports `findSupply`, with `whatElse` and `whoCouldMakeThisHappen` as wrappers.
- VERIFIED: ADR `docs/adr/001-canonical-supply-engine.md` forbids a second engine.
- Routes, verified by listing `src/routes`:
  - Home: `/`
  - Place pages: `/$country/$place`
  - Asking and offering: `/need`, `/need/$id`, `/make`, `/give`, `/help`, `/earn`
  - Personal pages: `/conversations`, `/life-list`, `/profile`, `/auth`
  - Trips: `/road-trip`, `/journey`
  - Trust and review: `/sources`, `/moderation`
  - Sitemaps: `api/public/sitemap*`
- Key journeys:
  - First visit, then place, then map or list, then a card with its TrustChip.
  - Ask for help, then a consent-based connection request, then conversations.
  - Offer an hour.
  - Find paid work on `/earn`.

## 3. Rules and CI
- These documents exist and apply: `AGENTS.md`, `docs/agents/INVARIANTS.md` (product and process failure conditions), ADR 001, ADR 002 (control plane), ADR 003 (capability is not the same as willingness or availability) and ADR 003 (programme constitution).
- Note: two ADRs share the number 003. Renumbering needs a human decision.
- CI is `.github/workflows/verify.yml`. It runs `bun install --frozen-lockfile`, then `bun run lint` (eslint), `bun run test` (vitest run) and `bun run build`.
- Human merge only. No force-push.

## 4. Analytics and business capability
- VERIFIED: the app code contains no product-analytics calls (searched for analytics, track(, posthog, gtag). Only Lovable's own hosting analytics exist outside the code.
- VERIFIED: the `listings` table already has business fields: `organisation`, `provider_note`, `qualification_note`, `booking_state`, `booking_url`, `service_category`, `origin`, `demonstration`. `src/lib/services.ts` treats an organisation as data ("no marketplace").
- Enquiries can reuse `connection_requests` and `connection_messages`, which are consent-based and covered by RLS, together with `user_blocks` and `content_reports`.
- Gaps:
  - There is no verified business identity or claim flow.
  - Nothing records who owns a listing on a business's behalf.
  - There is no way to count enquiries ethically.
  - There is no paid-placement policy.
  - The service taxonomy is not tied to the qualification rules for regulated categories.
- NOT VERIFIED: whether RLS actually works as intended, and whether the private schema is exposed. Both need a human check in the backend settings.

## 5. Recommended smallest safe improvement
**Show a clear "Who provides this" and "How to enquire" block on service listings in the entry sheet.** It would use only fields that are already stored:
- the organisation
- the provider note
- the qualification note, shown as stated by the provider and never as verified
- the booking state and booking link, opened as an external link with rel="noopener nofollow"
- the TrustChip

When a field is empty it says "Not stated". It adds no new data, schema, ranking or payments. It makes real local businesses easier to see and to contact, it creates the surface a later pilot can build on, and it keeps "stated" visibly separate from "verified".

### Files likely to change (later, after approval)
- `src/components/entry-sheet.tsx`
- `src/lib/services.ts`, for a pure `providerSummary()` helper if one is missing
- `src/lib/services.test.ts`

### Acceptance criteria
- The block appears only when `isService(entry)` is true.
- Empty fields read "Not stated". Nothing is inferred.
- A qualification is labelled "Stated by provider" unless the stored verification says otherwise.
- Regulated categories keep their existing caveats.
- Demonstration entries are still labelled.
- The block does not change `findSupply` ordering.
- The text is readable, colour is never the only signal, tap targets are at least 44 px, and links are keyboard reachable.
- Lint, test and build all pass in CI.

### Tests
- Unit tests for `providerSummary` covering three cases: all fields present, all empty, and a regulated category.
- A supply-engine snapshot test showing the ordering is unchanged.

### Risks and dependencies
- The wording could be read as an endorsement. Mitigation: always use the words "Stated by provider".
- Real business records do not exist yet, so the block will mostly show "Not stated" until providers join.
- A paid placement layer would need a new ADR and human approval for its legal and commercial side.
- The duplicate repo needs to be resolved first, so this work isn't done twice.

## Open decisions for the owner
1. Which repository is canonical: `life-lived-network` or `life-lived-network2`?
2. Backend option A, B or C.
3. Whether to renumber the duplicate ADR 003.
4. A policy for any future paid visibility. Recommended: no paid ranking inside `findSupply`, ever.
