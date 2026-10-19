# Current Status — 19 October 2026 (evening)

**main SHA:** `0c56cc299825dea5996323506e7a1cc9266975c8`

## Merged today (P0 + SEO)

| PR | Title | Result |
|----|-------|--------|
| #157 | Remove tracked `.env` | Merged |
| #163 | Explicit service-area only | Merged |
| #170 | Configurable default locality | Merged |
| #129 | robots.txt private routes | Merged |

## Still open / blocked

| PR | Status | Action needed |
|----|--------|---------------|
| #154 | Merge conflict (dirty) | Resolve conflict in `needs.functions.ts` then merge |
| #169 | Will conflict | Merge after #154 is clean |
| #162 | Draft, not DB-proven | Keep **out of limited-beta security claims** |
| #158 | Behind | Rebase or close |
| #166 | Ready | Can merge after conflicts cleared |

## Scope decisions locked

- Conversation isolation (#162): **Excluded** from limited-beta claims until disposable-DB proof exists.
- Australia: **Out of scope** for live data / marketing claims. Prototype planning only.
- No fabricated places, users, needs, or activity.

## What is now true on main

- Tracked `.env` removed from the tree
- Residence is no longer treated as service coverage
- Default locality is configurable via `VITE_DEFAULT_PLACE_SLUG`
- Repository `robots.txt` disallows private routes (live production still needs publish + verification)

## What is still required before strong investor claims

1. Resolve + merge #154 and #169 (exact counts + need validation)
2. Authorised publish so live robots.txt / sitemap can be checked
3. Clear, honest Limited Beta Scope language (already drafted)
4. No Australian coverage claims until real data gate is closed

## Recommended limited-beta narrative for next week’s meetings

> We have landed the core truthfulness and hygiene fixes: single discovery engine, explicit service areas, configurable locality, and repository-side SEO alignment. Exact counts and input validation are the last two code merges. Conversation security and Australian data remain explicit separate gates. The architecture is country-agnostic and ready for expansion once real place data and operational readiness exist.
