#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
# e2e -> tests -> qa-automation -> repo root
cd "$ROOT"
exec npm run test:e2e "$@"
