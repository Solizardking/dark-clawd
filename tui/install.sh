#!/usr/bin/env bash
# Dark Clawd one-shot installer (first release)
# curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | bash
# Source: https://github.com/Solizardking/dark-clawd
# Hub:    https://cheshireterminal.ai/dark-clawd
set -euo pipefail

PRODUCT_URL="${CLAWD_PRODUCT_URL:-https://cheshireterminal.ai/dark-clawd}"
GITHUB_URL="${CLAWD_GITHUB_URL:-https://github.com/Solizardking/dark-clawd}"
PKG="${CLAWD_NPM_PACKAGE:-@x402solana/dark-clawd}"
VERSION="${CLAWD_VERSION:-1.0.0}"
# Prebuilt npm tarball attached to the GitHub release (works without npm OTP publish)
TGZ_URL="${CLAWD_TGZ_URL:-https://github.com/Solizardking/dark-clawd/releases/download/v${VERSION}/x402solana-dark-clawd-${VERSION}.tgz}"
BIN_DIR="${CLAWD_BIN_DIR:-$HOME/.local/bin}"
INSTALL_MODE="${CLAWD_INSTALL_MODE:-auto}" # auto | npm | tgz | bun | npx-only
USER_PREFIX="${CLAWD_PREFIX:-$HOME/.darkclawd}"

echo ""
echo "🦞 Dark Clawd — recursive Solana + Robinhood automation TUI"
echo "   Hub:     $PRODUCT_URL"
echo "   GitHub:  $GITHUB_URL"
echo "   npm:     $PKG"
echo "   release: v$VERSION"
echo ""

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || return 1
}

have_node18() {
  need_cmd node || return 1
  node -e 'const m=process.versions.node.split(".")[0]|0; process.exit(m>=18?0:1)' 2>/dev/null
}

mkdir -p "$BIN_DIR"

link_bins_from_prefix() {
  local prefix="$1"
  local bin_src="$prefix/bin"
  [[ -d "$bin_src" ]] || return 0
  for b in dark-clawd clawd clawd-tui; do
    if [[ -e "$bin_src/$b" ]]; then
      ln -sfn "$bin_src/$b" "$BIN_DIR/$b" 2>/dev/null || true
    fi
  done
  export PATH="$bin_src:$BIN_DIR:$PATH"
}

install_with_npm_registry() {
  need_cmd npm || return 1
  if ! have_node18; then
    echo "⚠ Node.js ≥18 recommended (found: $(node -v 2>/dev/null || echo none))"
  fi
  echo "→ npm install -g $PKG"
  if npm install -g "$PKG" 2>/dev/null; then
    return 0
  fi
  echo "⚠ global registry install failed; trying user prefix $USER_PREFIX ..."
  if npm install -g --prefix "$USER_PREFIX" "$PKG" 2>/dev/null; then
    link_bins_from_prefix "$USER_PREFIX"
    return 0
  fi
  return 1
}

install_with_tarball() {
  need_cmd npm || return 1
  echo "→ npm install -g from GitHub release tarball"
  echo "   $TGZ_URL"
  if npm install -g "$TGZ_URL"; then
    return 0
  fi
  echo "⚠ global tarball install failed; trying user prefix $USER_PREFIX ..."
  if npm install -g --prefix "$USER_PREFIX" "$TGZ_URL"; then
    link_bins_from_prefix "$USER_PREFIX"
    return 0
  fi
  return 1
}

install_with_bun() {
  need_cmd bun || return 1
  echo "→ bun add -g $PKG"
  bun add -g "$PKG" 2>/dev/null || return 1
  return 0
}

case "$INSTALL_MODE" in
  npm)
    install_with_npm_registry || install_with_tarball || true
    ;;
  tgz)
    install_with_tarball || true
    ;;
  bun)
    install_with_bun || install_with_tarball || true
    ;;
  npx-only)
    echo "→ npx-only mode (no global install)"
    ;;
  *)
    # Prefer registry; fall back to GitHub release asset (always works for v1.0.0)
    install_with_npm_registry || install_with_tarball || install_with_bun || true
    ;;
esac

# Ensure wrapper for npx fallback when global bin is missing
if ! need_cmd dark-clawd; then
  WRAPPER="$BIN_DIR/dark-clawd"
  cat > "$WRAPPER" <<EOF
#!/usr/bin/env bash
# Dark Clawd npx fallback — prefers release tarball when registry package is missing
if npm view ${PKG} version >/dev/null 2>&1; then
  exec npx --yes ${PKG} "\$@"
fi
exec npx --yes ${TGZ_URL} "\$@"
EOF
  chmod +x "$WRAPPER"
  echo "→ installed launcher: $WRAPPER"
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
  echo "✓ Install finished — add PATH or use npx (see below)"
fi
echo ""
echo "  Help:     dark-clawd --help"
echo "  Welcome:  dark-clawd welcome"
echo "  Status:   dark-clawd status"
echo "  Setup:    dark-clawd setup"
echo "  TUI:      dark-clawd run"
echo ""
echo "  Hub:      $PRODUCT_URL"
echo "  GitHub:   $GITHUB_URL"
echo "  Release:  $GITHUB_URL/releases/tag/v$VERSION"
echo "  Issues:   $GITHUB_URL/issues"
echo ""
echo "Manual install (GitHub release tarball):"
echo "  npm install -g $TGZ_URL"
echo ""
echo "PATH tips:"
echo "  export PATH=\"$BIN_DIR:\$PATH\""
if [[ -d "$USER_PREFIX/bin" ]]; then
  echo "  export PATH=\"$USER_PREFIX/bin:\$PATH\""
fi
echo ""
