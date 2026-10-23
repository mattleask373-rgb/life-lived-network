#!/usr/bin/env bash
set -euo pipefail

# Only placeholder templates may be tracked. Real .env files belong in secret storage.
tracked_env_files="$(
  git ls-files | while IFS= read -r tracked_file; do
    case "$tracked_file" in
      .env.example|*/.env.example) ;;
      .env|.env.*|*/.env|*/.env.*) printf '%s ' "$tracked_file" ;;
    esac
  done
)"

if [[ -n "$tracked_env_files" ]]; then
  echo "::error::Tracked environment files are not allowed; only placeholder .env.example may be committed."
  exit 1
fi
