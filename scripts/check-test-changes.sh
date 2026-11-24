#!/usr/bin/env bash
# Fails when a test file lost or rewrote lines compared with the base branch.
# Usage: scripts/check-test-changes.sh <base-ref>   e.g. origin/main
set -euo pipefail

base="${1:?usage: $0 <base-ref>}"

is_test_file='\.(spec\.ts|int-spec\.ts|test\.tsx)$|^apps/frontend/e2e/'

touched=$(git diff --numstat --no-renames "$base...HEAD" |
  awk -F'\t' -v pattern="$is_test_file" '$3 ~ pattern && $2 != "0" { printf "  %s\t(+%s -%s)\n", $3, $1, $2 }')

if [ -n "$touched" ]; then
  echo "These test files have removed or rewritten lines compared with $base:"
  echo "$touched"
  echo
  echo "Make sure the change keeps the tests honest (it doesn't weaken or delete a check)."
  exit 1
fi

echo "Test files only gained lines compared with $base."
