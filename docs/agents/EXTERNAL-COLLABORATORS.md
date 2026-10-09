# External code collaborators (e.g. Grok / xAI via GitHub)

Outside agents work only through GitHub. Lovable stays the primary place for UI iteration.

## Access
- Start read-only. Upgrade to read + write (Contents, Pull requests) only after one good review cycle.
- Grant access to this repository only, not all repositories.
- Never hand outside agents backend keys, service-role keys or secrets. They are not in the repo and must not be added.

## Working rules
1. Read `AGENTS.md`, `docs/agents/INVARIANTS.md`, `docs/adr/` and the product constitution before any change.
2. Work on a branch named `agent/grok/<task_id>-short-slug`. Never push to `main`.
3. Open small, reviewable pull requests. Each explains its purpose and what becomes possible.
4. Never modify auto-generated files: `src/integrations/supabase/*`, `src/routeTree.gen.ts`, `.env`, `supabase/config.toml`.
5. Never add migrations that drop, rename or weaken RLS. Schema changes require human approval.
6. Do not create a second discovery engine; extend `src/lib/supply-engine.ts`.
7. Before editing a file, check open PRs and recent commits for overlap; if Lovable touched it in the last 24h, comment instead of editing.
8. CI (`.github/workflows/verify.yml`) must pass. Never weaken tests.
9. No force-push, no history rewrite, no merge — a human merges.
