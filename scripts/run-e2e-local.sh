#!/usr/bin/env bash
set -euo pipefail

if [[ "${SKIP_E2E:-0}" == "1" ]]; then
  echo "[e2e-local] skipping Cypress e2e because SKIP_E2E=1"
  exit 0
fi

if [[ "${FORCE_E2E:-0}" != "1" && "$(uname -s)" == "Darwin" ]]; then
  echo "[e2e-local] skipping Cypress e2e on macOS (set FORCE_E2E=1 to override)"
  exit 0
fi

BASE_URL=${CYPRESS_BASE_URL:-http://localhost:3000}

echo "[e2e-local] running Cypress e2e against $BASE_URL"
CYPRESS_BASE_URL="$BASE_URL" pnpm e2e:run
