#!/usr/bin/env bash
set -euo pipefail

repo="${GH_REPO:-${GITHUB_REPOSITORY}}"
root="$(git rev-parse --show-toplevel)"
cd "$root"

now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
sha="$(git rev-parse HEAD)"

pr_json="$(gh api --paginate "repos/$repo/pulls?state=open&per_page=100" 2>/dev/null || printf '[]')"
open_prs="$(printf '%s' "$pr_json" | jq -s 'add | map({number,title,draft,head:.head.ref,base:.base.ref})')"
open_count="$(printf '%s' "$open_prs" | jq 'length')"

runs_json="$(gh api "repos/$repo/actions/runs?branch=main&per_page=20" 2>/dev/null || printf '{"workflow_runs":[]}')"
recent_failures="$(printf '%s' "$runs_json" | jq '[.workflow_runs[] | select(.conclusion == "failure") | {id,name,head_sha,updated_at}]')"
failure_count="$(printf '%s' "$recent_failures" | jq 'length')"

manifest_version="$(node -e 'const p=require("./package.json"); console.log(p.devDependencies["@lovable.dev/vite-tanstack-config"])')"
lock_version="$(grep -A80 '"devDependencies"' bun.lock | grep -m1 '"@lovable.dev/vite-tanstack-config"' | sed -E 's/.*: "([^"]+)".*/\1/')"

lock_status="green"
lock_detail="package manifest and bun.lock agree on @lovable.dev/vite-tanstack-config"
if [ "$manifest_version" != "$lock_version" ]; then
  lock_status="blocked"
  lock_detail="package.json requests $manifest_version while bun.lock records $lock_version"
fi

executor_status="MISSING"
executor_detail="No durable authenticated provider-neutral executor evidence is asserted by this sentinel."

cat <<REPORT
# Fleet Sentinel Pulse

- Observed: $now
- Main SHA: $sha
- Open PRs: $open_count
- Recent main workflow failures (last 20): $failure_count
- Frozen-lockfile preflight: **$lock_status** — $lock_detail
- Persistent autonomous executor: **$executor_status** — $executor_detail

## Open work

$(printf '%s' "$open_prs" | jq -r '.[] | "- #\(.number) [\(.title)] — \(.head) → \(.base)"')

## Recent failures

$(if [ "$failure_count" -eq 0 ]; then echo '- None observed in the last 20 main runs.'; else printf '%s' "$recent_failures" | jq -r '.[] | "- run \(.id): \(.name) — \(.head_sha) — \(.updated_at)"'; fi)

## Sentinel invariants

- Read-only GitHub/API permissions.
- No merge, deploy, issue mutation, branch mutation, secret access, or external side effects.
- This workflow reports evidence; it does not infer availability, inventory, learner capability, demand, or autonomous execution.
- Human integration gates remain authoritative.
REPORT
