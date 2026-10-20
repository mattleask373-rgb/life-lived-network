# Grok visual integration — working agreement

## Goal

Port the prototype's warm paper/cream/forest palette, Fraunces/Manrope typography, compass, photo-led cards and thumb-friendly mobile patterns into the canonical app without replacing its domain model, routes, auth, database, ingestion, sitemap or discovery engine.

Reference-only branch: `reference/grok-design-2026-10-20`.
Design integration branch: `integration/grok-design-2026-10-20`.
Canonical base at branch creation: `0c56cc299825dea5996323506e7a1cc9266975c8`.

The app already has the compass mark, desktop navigation, mobile tabs, paper tokens and Fraunces/Manrope stylesheet links. This slice fixes the font-token mismatch and updates the listing-card and place-picker visuals. No mock routes/data were copied into production code.

## Slice plan

| Slice | Take from prototype | Preserve from canonical app | Acceptance checks |
|---|---|---|---|
| 0. Tokens and identity | Paper #f3f0e8, cream #fffcf7, forest #0c6b56, sage #e3f2eb; Fraunces + Manrope; compass | Existing CSS token aliases, route tree, SEO, existing logo | Global styles compile; correct loaded fonts; focus remains visible |
| 1. Listing cards + place picker (this PR) | 4:3 photo region, warm surface, large radius, understated metadata, hierarchy chips, image credit | `WorldEntry`, source-backed `entry.photos`, TrustChip, currency helpers, demonstration badge, canonical place search, loading/error states | 375px and 1280px; no overflow; no fake images; quiet/error states stay honest; interactive controls >=44px; keyboard/screen-reader labels |
| 2. Home top section | Editorial heading scale, whitespace, compact filters, primary action | Locality context, map/list switch, `findSupply()`, honest counts and next steps | No new feed/ranker; counts/data load truthfully; filters/context persist |
| 3. Detail sheet + map pins | Photo framing, surface treatment, rounded pins | Real IDs, provenance, cancellation/freshness, map and dialog focus behaviour | 375px map gestures, 44px controls, no new provider claims |
| 4. Locality/service pages | Typography, card rhythm, breadcrumb styling | Existing server-rendered locality/service routes, indexability gate, canonical URL and sitemap rules | Demo excluded from indexing; quiet pages noindex; real links only; unknown slug 404 |
| 5. Journey / Road Trip | Reusable cards and selected states | Actual corridor read and unavailable-provider states | Place/time/context survives; no guessed ETAs |
| 6. Account / profile | Form surfaces and input treatment | Session, private data, reporting/blocking/moderation/export/deletion | No private-data flash before auth; no security-boundary change |

## Shared QA checklist

- At 375px and 1280px: no horizontal overflow, headings reflow, long locality names work, and loading/empty/error/retry states still show.
- All interactive targets >=44x44 CSS px, focus visible, keyboard navigation sane, no traps, controls named for screen readers.
- Alt/credit come from the source record. No photo gets a neutral placeholder. Prototype images and mock listings are never copied.
- Every claim is from canonical current data. `findSupply()` remains sole discovery authority; no matcher/ranker fork.
- Demonstration remains labelled and cannot qualify a page for indexing. No person/place/event or availability is invented.
- Preserve explicit service-area rules, no exact private-address exposure, privacy routes, and owner-only memories.
- Preserve current integer-cents/currency contract. A visual slice must not alter money or database semantics.
- Require frozen-lockfile install, lint, tests, production build and hosted `verify`; manually check mobile/desktop and keyboard/accessibility before merge.

## Agent ownership and no-overwrite rule

1. One writer per file per slice; PR body must name the files and owner.
2. Grok proposes design, screenshots and visual diff via its own GitHub branch/PR. It does not author inventory or choose a new data model.
3. Codex/ChatGPT owns architectural integration, canonical contracts, regression tests and release evidence.
4. Lovable owns assigned UI implementation only on the designated branch. Before editing, compare its branch SHA with the latest PR head; never publish stale local state over a branch another agent updated.
5. Unexpected branch movement means stop and compare commits/diffs. Preserve newer work, continue from current SHA with normal commits or a new branch. Never force-push or rewrite published history.
6. Every PR states purpose, non-goals, Verify links, launch impact and human decisions. A human independently reviews and merges.
7. A human repository owner should enable rules on `main`: PR required, founder approval, `verify` required and current, no force-push/deletion, and no bot/admin bypass. This PR does not change GitHub repository settings.

## Rollback

For a visual regression, revert the exact merged design PR in a new reviewed PR. This slice changes only CSS/components/tests/docs; it does not touch routes, data, schema, RLS, grants, secrets or integrations. Avoid restoring a full old prototype archive because that could erase unrelated product work.
