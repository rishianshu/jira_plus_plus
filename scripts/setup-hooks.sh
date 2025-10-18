#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
HOOK_DIR="$ROOT/.git/hooks"

mkdir -p "$HOOK_DIR"

cp "$ROOT/.github/hooks/pre-commit.sample" "$HOOK_DIR/pre-commit"
cp "$ROOT/.github/hooks/pre-push.sample" "$HOOK_DIR/pre-push"

chmod +x "$HOOK_DIR/pre-commit" "$HOOK_DIR/pre-push"

echo "[hooks] Installed pre-commit and pre-push hooks."
