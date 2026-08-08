#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

run_step() {
  label="$1"
  shift

  printf '\n==> %s\n' "$label"
  (cd "$ROOT_DIR" && "$@")
}

run_step "Workspace package inventory" pnpm run inventory:check
run_step "Package dependency declarations" pnpm run deps:check
run_step "TypeScript config consistency" pnpm run tsconfig:check
run_step "TypeScript static checks" pnpm run lint
run_step "Environment template coverage" pnpm run env:check
run_step "Workspace tests" pnpm run test
run_step "Workspace build" pnpm run build
run_step "Package manifest contracts" pnpm run contracts:check
run_step "Built package smoke imports" pnpm run smoke:packages
run_step "Publishable package dry-runs" pnpm run pack:check
