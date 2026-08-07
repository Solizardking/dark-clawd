#!/usr/bin/env bash
# Dark Clawd one-shot installer
# curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | bash
set -euo pipefail

PRODUCT_URL="${CLAWD_PRODUCT_URL:-https://cheshireterminal.ai/dark-clawd}"
PKG="${CLAWD_NPM_PACKAGE:-@openclawdsolana/dark-clawd}"
BIN_DIR="${CLAWD_BIN_DIR:-$HOME/.local/bin}"
INSTALL_MODE="${CLAWD_INSTALL_MODE:-npm}" # npm | bun | npx-only

echo ""
echo "🦞 Dark Clawd — recursive Solana + Robinhood automation TUI"
echo "   Product: $PRODUCT_URL"
echo ""

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || return 1
}

mkdir -p "$BIN_DIR"

install_with_npm() {
  if need_cmd npm; then
    echo "→ npm install -g $PKG"
    npm install -g "$PKG" || {
      echo "⚠ global npm install failed; trying user prefix..."
      npm install -g --prefix "$HOME/.darkclawd" "$PKG"
      export PATH="$HOME/.darkclawd/bin:$PATH"
    }
    return 0
  fi
  return 1
}

install_with_bun() {
  if need_cmd bun; then
    echo "→ bun add -g $PKG"
    bun add -g "$PKG" || true
    return 0
  fi
  return 1
}

case "$INSTALL_MODE" in
  bun)
    install_with_bun || install_with_npm || true
    ;;
  npx-only)
    echo "→ npx-only mode (no global install)"
    ;;
  *)
    install_with_npm || install_with_bun || true
    ;;
esac

# Ensure wrapper for npx fallback
WRAPPER="$BIN_DIR/dark-clawd"
if ! need_cmd dark-clawd; then
  cat > "$WRAPPER" <<EOF
#!/usr/bin/env bash
exec npx --yes ${PKG} "\$@"
EOF
  chmod +x "$WRAPPER"
  echo "→ installed wrapper: $WRAPPER"
fi

# Config dir
mkdir -p "${HOME}/.darkclawd"
if [[ ! -f "${HOME}/.darkclawd/config.env.example" ]]; then
  cat > "${HOME}/.darkclawd/config.env.example" <<'ENV'
# Dark Clawd environment
HELIUS_API_KEY=
BIRDEYE_API_KEY=
XAI_API_KEY=
OPENROUTER_API_KEY=
SOLANA_RPC_URL=
SOLANA_PRIVATE_KEY=
CLAWD_AUTO_MODE=true
CLAWD_SANDBOX_PORT=18790
ENV
fi

echo ""
echo "✓ Dark Clawd ready"
echo ""
echo "  Help:     dark-clawd --help   (or: npx $PKG --help)"
echo "  TUI:      dark-clawd run"
echo "  Status:   dark-clawd status"
echo "  Sandbox:  dark-clawd sandbox"
echo "  Trade:    dark-clawd trade --chain solana --token <mint> --side buy --amount 0.1"
echo "  Auto:     dark-clawd automate create --name dca --chain solana --token <mint> --amount 0.05"
echo ""
echo "  Hub:      $PRODUCT_URL"
echo "  Fly:      dark-clawd sandbox  # then fly deploy with package fly.toml"
echo ""
echo "Add to PATH if needed:  export PATH=\"$BIN_DIR:\$PATH\""
echo ""
