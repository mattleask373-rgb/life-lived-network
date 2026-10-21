# Read-only project integration audit: Real World Atlas (b3293d2a-…)

Done on 21 Oct 2026 at 23:03 UTC. Only this note was written. Nothing was committed by me, published, migrated or reconfigured. The task list was not updated because the request said not to edit files.

## 1. Connected GitHub repo and sync branch

**Settings: UNVERIFIED.** Project Settings → Git cannot be read from this session. The sandbox git remotes are only Lovable internal storage (`lovable-gcp.code.storage/b3293d2a-….git`) and an internal backup. Neither is a GitHub URL.

**Indirect evidence (strong, but not proof from settings):**
- This project's current commit `ad0f58aa6658f1c4b1e365075274abc64b7e4094` exists on GitHub in `mattleask373-rgb/life-lived-network`.
- It is authored by `gpt-engineer-app[bot]` (Lovable's sync identity) and changes only `.lovable/plan.md`.
- It is the head of branch **`Loveable/work/safely`**, not `main`.

This points to sync going to that repo on the non-main branch `Loveable/work/safely`. Treat it as observed behaviour, not a confirmed setting.

## 2. Project commit compared with canonical main

| | SHA | Date |
|---|---|---|
| Project HEAD (sandbox edit branch `edit/edt-84886b95…`) | `ad0f58a` | 21:57 UTC |
| GitHub `main` | `1cf9b21b6fae9fef2b504b2993d37d2f99766d6d` | 21:13 UTC |
| Merge base | `ccbcc6acdbc3dcdf6895c0f624b301418257a6e3` | — |

GitHub compare `main...ad0f58a` reports **diverged: 14 commits ahead, 161 behind**. This project lacks the 161 reviewed commits on main, including #262 and everything merged after `ccbcc6a`. Its 14 extra commits are Lovable-side, such as the plan notes and the earlier `map-view.ts` and `work-opportunities.ts` type fixes. Those were not itemised this turn.

## 3. Published hostname and runtime
- Published URL (project metadata): `https://life-lived-network.lovable.app`. It answers HTTP 200. No custom domain is listed.
- Runtime: TanStack Start on Cloudflare-Workers-style edge hosting, per `.lovable/project.json` template `tanstack_start_ts_current`. The backend is Lovable Cloud, with one instance shared by preview and published app.
- **Unverified:** which commit the published site is built from. Publishing is manual, so it may be older than `ad0f58a`.

## 4. Can this project safely take in reviewed PRs through a non-main branch?

**Human intervention is required first.**
- Sync appears to target `Loveable/work/safely`. A Lovable code edit would therefore land there, not on `main`, but only if that setting is real. The owner must confirm it in Project Settings → Git.
- That branch is 161 commits behind `main`. Lovable only receives commits pushed to its synced branch. Reviewed PRs merged into `main` do not reach this project until someone merges `main` into `Loveable/work/safely` on GitHub, through a PR.
- Two risks if anyone edits here now:
  - New work builds on stale code. Earlier versions of routes and sitemaps could be re-pushed, conflicting with main.
  - If that later PR into main is force-pushed or rebased, Lovable may treat it as divergence and park its work on `lovable-sync`.
- No branch protection exists for `Loveable/work/safely`; earlier evidence showed rulesets only on main.

## 5. Recommended read-only integration sequence (for the owner and reviewers)
1. **Owner confirms the sync settings.** Project Settings → Git shows repo `mattleask373-rgb/life-lived-network` and branch `Loveable/work/safely`. Record a screenshot or note on issue #263, Step 1.
2. **Freeze Lovable code edits** until step 4 is done. Plan or read-only turns only.
3. **Classify the 14 Lovable-only commits** on GitHub (`main...Loveable/work/safely`): keep, port as a small PR, or drop. Plan notes can stay out of `main`.
4. **Open a PR merging `main` into `Loveable/work/safely`.** Normal merge, no rebase or force-push. Resolve conflicts in favour of `main` for routes, the `seo-route-policy` registry, `findSupply()` and `src/lib/ingest/*`. Require `verify` on the exact head, then merge. Lovable then pulls the reviewed code.
5. **Add a ruleset** for `Loveable/work/*`: PR required, `verify` required, no force-push or deletion. Confirm it applies to that branch.
6. **Keep reviewed feature PRs targeting `main`.** They include #271, #272, #275 and #276, and the draft #278 (`agent/chatgpt/staging-load-smoke-2026-10-21`, head `80d33c4`). #278 adds only `docs/scale/STAGING-LOAD-TESTING.md` and `tests/load/staging-public-read.js`: no routes, matcher or discovery logic. It must run against a confirmed staging host only, never the published URL, which needs owner approval. After each merge to main, repeat step 4 so Lovable stays current.
7. Only then allow a Lovable code-writing turn: small, against the up-to-date branch, ending in a PR to `main`.

## Blockers
- Git sync settings are not visible from here. Confirming repo and branch needs the owner.
- `Loveable/work/safely` is 161 commits behind main. It needs a GitHub-side merge PR.
- No protection exists on the Lovable sync branch.
- The commit behind the published site is unknown.
- #278's staging host and approval are not confirmed. Its CI was not checked this turn.
