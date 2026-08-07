#!/bin/sh
# ═══════════════════════════════════════════════════════════════════════════
# Crustacean Automation — Clawd Automaton Installer
# One-shot install for the Clawd / Crustacean Automation agent runtime.
#
# curl -fsSL https://github.com/Solizardking/on-chain-ai-kit/raw/main/automaton/scripts/crustacean-automation.sh | sh
#
# Clones this repo's Clawd automaton surface (not Conway-Research / conway.tech).
# The shell molts. The laws do not.
# ═══════════════════════════════════════════════════════════════════════════
set -e

REPO="${CLAWD_AUTOMATON_REPO:-https://github.com/Solizardking/on-chain-ai-kit.git}"
DIR="${CLAWD_AUTOMATON_DIR:-/opt/clawd-automaton}"
BRANCH="${CLAWD_AUTOMATON_BRANCH:-main}"

echo ""
echo "  🦞  Crustacean Automation — Clawd Automaton Installer"
echo "  ────────────────────────────────────────────────────"
echo "  Repo:   $REPO"
echo "  Target: $DIR"
echo "  Branch: $BRANCH"
echo ""

if [ -d "$DIR/.git" ]; then
  echo "==> Existing install found at $DIR — pulling latest..."
  git -C "$DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$DIR" checkout "$BRANCH"
  git -C "$DIR" pull --ff-only origin "$BRANCH" || true
else
  echo "==> Cloning Clawd automaton (on-chain-ai-kit)..."
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$DIR"
fi

cd "$DIR/automaton"

if [ ! -f package.json ]; then
  echo "ERROR: automaton package not found at $DIR/automaton" >&2
  exit 1
fi

# Install constitution into runtime state dir (immutable, read-only)
STATE_DIR="${HOME:-/root}/.automaton"
mkdir -p "$STATE_DIR"
if [ -f constitution.md ]; then
  cp constitution.md "$STATE_DIR/constitution.md"
  chmod 444 "$STATE_DIR/constitution.md" 2>/dev/null || true
  echo "==> Clawd constitution installed (read-only)"
fi

if [ -f scripts/clawd-rules.txt ]; then
  cp scripts/clawd-rules.txt "$STATE_DIR/clawd-rules.txt"
  chmod 444 "$STATE_DIR/clawd-rules.txt" 2>/dev/null || true
  echo "==> Clawd rules installed (read-only)"
fi

echo "==> Installing dependencies..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm install && pnpm run build
elif command -v npm >/dev/null 2>&1; then
  npm install && npm run build
else
  echo "ERROR: need npm or pnpm" >&2
  exit 1
fi

echo "==> Starting Clawd automaton..."
exec node dist/index.js --run
