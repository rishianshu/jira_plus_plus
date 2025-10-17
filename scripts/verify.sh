#!/usr/bin/env bash
set -euo pipefail

echo "[verify] installing deps"
pnpm install --frozen-lockfile >/dev/null

echo "[verify] lint"
pnpm lint

echo "[verify] typecheck"
pnpm typecheck

echo "[verify] test"
pnpm test

echo "[verify] docker build api"
docker build -f Dockerfile.api -t jira-plus-plus/api:verify . >/dev/null

echo "[verify] docker build web"
docker build -f Dockerfile.web -t jira-plus-plus/web:verify . >/dev/null

echo "[verify] completed"
