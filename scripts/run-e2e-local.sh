#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${CYPRESS_BASE_URL:-http://localhost:3000}

echo "[e2e-local] running Cypress e2e against $BASE_URL"
CYPRESS_BASE_URL="$BASE_URL" pnpm e2e:run
