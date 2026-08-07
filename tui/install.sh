#!/usr/bin/env bash
# Dark Clawd one-shot installer (first release)
# curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | bash
# Source: https://github.com/Solizardking/dark-clawd  ·  Hub: https://cheshireterminal.ai/dark-clawd
set -euo pipefail

PRODUCT_URL="${CLAWD_PRODUCT_URL:-https://cheshireterminal.ai/dark-clawd}"
GITHUB_URL="${CLAWD_GITHUB_URL:-https://github.com/Solizardking/dark-clawd}"
PKG="${CLAWD_NPM_PACKAGE:-@openclawdsolana/dark-clawd}"
BIN_DIR="${CLAWD_BIN_DIR:-$HOME/.local/bin}"
INSTALL_MODE="${CLAWD_INSTALL_MODE:-npm}" # npm | bun | npx-only

echo ""
echo "🦞 Dark Clawd — recursive Solana + Robinhood automation TUI"
echo "   Hub:    $PRODUCT_URL"
echo "   GitHub: $GITHUB_URL"
echo "   npm:    $PKG"
echo ""

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || return 1
}

have_node18() {
  need_cmd node || return 1
  node -e 'const m=process.versions.node.split(".")[0]|0; process.exit(m>=18?0:1)' 2>/dev/null
}

mkdir -p "$BIN_DIR"

install_with_npm() {
  if need_cmd npm; then
    if ! have_node18; then
      echo "⚠ Node.js ≥18 recommended (found: $(node -v 2>/dev/null || echo none))"
    fi
    echo "→ npm install -g $PKG"
    if npm install -g "$PKG"; then
      return 0
    fi
    echo "⚠ global npm install failed; trying user prefix ~/.darkclawd ..."
    npm install -g --prefix "$HOME/.darkclawd" "$PKG"
    export PATH="$HOME/.darkclawd/bin:$PATH"
    # Persist path hint
    if [[ -d "$HOME/.darkclawd/bin" ]]; then
      ln -sfn "$HOME/.darkclawd/bin/dark-clawd" "$BIN_DIR/dark-clawd" 2>/dev/null || true
      ln -sfn "$HOME/.darkclawd/bin/clawd" "$BIN_DIR/clawd" 2>/dev/null || true
    fi
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

# Ensure wrapper for npx fallback when global bin is missing
WRAPPER="$BIN_DIR/dark-clawd"
if ! need_cmd dark-clawd; then
  cat > "$WRAPPER" <<EOF
#!/usr/bin/env bash
exec npx --yes ${PKG} "\$@"
EOF
  chmod +x "$WRAPPER"
  echo "→ installed npx wrapper: $WRAPPER"
fi

# Config dir
mkdir -p "${HOME}/.darkclawd"
if [[ ! -f "${HOME}/.darkclawd/config.env.example" ]]; then
  cat > "${HOME}/.darkclawd/config.env.example" <<'ENV'
# Dark Clawd environment (copy to ~/.darkclawd/config.env or project .env)
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
if need_cmd dark-clawd; then
  echo "✓ Dark Clawd ready"
  dark-clawd welcome 2>/dev/null || true
else
  echo "✓ Install finished (use npx if PATH is not set yet)"
fi
echo ""
echo "  Help:     dark-clawd --help   (or: npx $PKG --help)"
echo "  Welcome:  dark-clawd welcome"
echo "  Status:   dark-clawd status"
echo "  Setup:    dark-clawd setup"
echo "  TUI:      dark-clawd run"
echo "  Sandbox:  dark-clawd sandbox"
echo ""
echo "  Hub:      $PRODUCT_URL"
echo "  GitHub:   $GITHUB_URL"
echo "  Issues:   $GITHUB_URL/issues"
echo ""
echo "Add to PATH if needed:"
echo "  export PATH=\"$BIN_DIR:\$PATH\""
if [[ -d "$HOME/.darkclawd/bin" ]]; then
  echo "  export PATH=\"$HOME/.darkclawd/bin:\$PATH\""
fi
echo ""
