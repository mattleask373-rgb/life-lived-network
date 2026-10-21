# Grok visual prototype — reference only

**Snapshot received:** `grok-workspace.zip`, SHA-256 `6eae21ffddcb1cd1b62025c416cd979ae2fa500321fce83b158b870c838c72a6` (uploaded 20 October 2026).
**Canonical product repository:** `mattleask373-rgb/life-lived-network`.
**Purpose:** preserve the reusable visual language and implementation patterns without promoting the standalone prototype into the product.

## Important boundary

This branch is a design-reference branch, not a deployable application. It intentionally does not import the prototype's routing, data store, auth layer, database code, fixtures, or demo records into the canonical app. Prototype routes such as `/moments`, hard-coded cities and `src/data/atlas.ts` belong to the mock application, not the production system.

Never merge this reference branch to `main`. Use a reviewed design PR to port a small UI change into the current application. Product data and domain behaviour stay in the canonical repository.

## Preserved design source

- `prototype-styles.css`: source palette, Fraunces + Manrope typography, soft motion and focus treatment.
- `prototype-ui-patterns.md`: original compass mark, photo card and phone navigation patterns, with fake-data wiring deliberately excluded.
- Original prototype component paths in the uploaded archive: `.grok/...`, `src/components/shell.tsx`, `src/components/bits.tsx`, `src/routes/index.tsx`, `src/data/atlas.ts`.

The complete original archive remains available in the originating conversation upload; this branch preserves the visual source and the portable UI excerpts, not the prototype's full mock application.

## Porting checklist

Before a visual change is accepted, it must use current `WorldEntry` / canonical place data, retain source provenance and demonstration labelling, preserve route/auth/privacy boundaries, pass `bun install --frozen-lockfile`, lint, tests and build, and be checked at 375px and 1280px with keyboard and screen-reader basics. No prototype host, city, photograph or event should appear unless the current product data provides it.
