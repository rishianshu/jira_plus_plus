#!/usr/bin/env sh
set -e

if [ "${SKIP_PRISMA_MIGRATE:-0}" = "1" ]; then
  echo "[entrypoint] Skipping Prisma migrate deploy"
else
  echo "[entrypoint] Running Prisma migrate deploy"
  pnpm --filter @jira-plus-plus/api prisma migrate deploy --schema prisma/schema.prisma
fi

exec "$@"
