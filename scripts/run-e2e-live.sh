#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${CYPRESS_BASE_URL:-https://app.jira-plus-plus.in}

echo "[e2e-live] running Cypress smoke tests against $BASE_URL"
CYPRESS_BASE_URL="$BASE_URL" pnpm e2e:run
