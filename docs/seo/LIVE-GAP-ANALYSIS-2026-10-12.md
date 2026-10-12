# Live SEO / robots / sitemap gap analysis — 2026-10-12

**Status:** Probe only. Not a claim of production public serving, indexability, or access-control effectiveness.
**Author:** Grok (external collaborator)
**Related:** Draft PR #129 (code-level robots.txt PRIVATE_PATHS alignment), Issue #128 (SEO follow-up), Issue #132 (signed-out private-route QA).

## Probe performed
Candidate published origin taken from the tracked `.env` on main (URL not reproduced here):
`https://c--b3293d2a-3218-4206-ab04-af8e984023ac-prod.lovable.cloud`

Requests issued (UTC ~2026-10-12 14:40):
- `/robots.txt` → returned content-signals preamble only (EU copyright directive style). No `User-agent`, `Disallow`, or path-specific rules observed in the response body.
- `/sitemap.xml` → `{"error":"requested path is invalid"}`
- `/memories` → same invalid-path error
- `/partners` → same invalid-path error

## Interpretation (strict)
- Code-level alignment in PR #129 (disallow of `/memories`, `/partners`, `/partner-tracker` and regression tests against `PRIVATE_PATHS`) is **not yet live** because the PR is unmerged.
- This probe does **not** prove the origin is publicly serving the app, nor that robots/sitemap are absent in production. Prior sessions also failed to retrieve expected public content from this host.
- Invalid-path responses for private routes are consistent with either (a) the host not serving the SPA routes, (b) a gateway rejecting unknown paths, or (c) auth redirects that the simple GET could not follow. **UNKNOWN** which.
- No live Supabase, no credentials, no production writes, no fabricated traffic or indexation claims.

## Recommended next (human or agent with working external HTTP)
1. Confirm the actual published domain (Lovable dashboard or custom domain) independently.
2. Fetch `/robots.txt`, `/sitemap.xml`, and a sample of public vs private paths with a full browser or curl that follows redirects; record status, Location, content-type, and excerpts.
3. After #129 merges, re-probe and confirm Disallow entries match PRIVATE_PATHS.
4. Keep memories and other owner-only surfaces out of any public sitemap or crawler path.

## Safety
Draft documentation only. No merge, no deploy, no RLS/credential change, no external contact.
Evidence or it did not happen.