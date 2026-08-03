#!/usr/bin/env bash
set -euo pipefail

# Package (and optionally publish) the MasterCommit VS Code extension.
#
# Usage:
#   ./scripts/deploy.sh            # build + package -> dist/*.vsix
#   ./scripts/deploy.sh --publish  # build + package + publish to Marketplace
#
# Publishing requires VSCE_PAT (Marketplace Personal Access Token) in the environment.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PUBLISH=false
if [[ "${1:-}" == "--publish" ]]; then
  PUBLISH=true
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree not clean. Commit or stash changes before deploying." >&2
  exit 1
fi

VERSION="$(node -p "require('./package.json').version")"
echo "==> Deploying mastercommit v${VERSION}"

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

echo "==> Type check"
pnpm run check-types

echo "==> Lint"
pnpm run lint

echo "==> Running tests"
pnpm test

echo "==> Building production bundle"
pnpm run package

mkdir -p dist
VSIX_PATH="dist/mastercommit-${VERSION}.vsix"

echo "==> Packaging .vsix"
pnpm dlx @vscode/vsce package --out "$VSIX_PATH"

echo "==> Package created: ${VSIX_PATH}"

if [[ "$PUBLISH" == true ]]; then
  if [[ -z "${VSCE_PAT:-}" ]]; then
    echo "VSCE_PAT env var not set. Cannot publish." >&2
    exit 1
  fi
  echo "==> Publishing to VS Code Marketplace"
  pnpm dlx @vscode/vsce publish --packagePath "$VSIX_PATH" --pat "$VSCE_PAT"
  echo "==> Published v${VERSION}"
else
  echo "==> Skipping publish (pass --publish to publish to the Marketplace)"
fi
