/**
 * Canonical product identity for Dark Clawd first release.
 * Single source for hub, GitHub, npm, and install copy.
 */
export const PRODUCT_NAME = 'Dark Clawd';
export const PRODUCT_TAGLINE =
  'Autonomous Solana terminal intelligence — Bloomberg-style TUI + automation';
export const PACKAGE_NAME = '@x402solana/dark-clawd';
export const PACKAGE_VERSION = '1.0.0';

export const PRODUCT_HUB_URL = 'https://cheshireterminal.ai/dark-clawd';
export const PRODUCT_GITHUB_URL = 'https://github.com/Solizardking/dark-clawd';
export const PRODUCT_GITHUB_ISSUES_URL = `${PRODUCT_GITHUB_URL}/issues`;
export const PRODUCT_INSTALL_SH_URL =
  'https://cheshireterminal.ai/api/dark-clawd/install.sh';
export const PRODUCT_INSTALL_SH_GITHUB_URL =
  'https://raw.githubusercontent.com/Solizardking/dark-clawd/main/tui/install.sh';
export const PRODUCT_INSTALL_CURL = `curl -fsSL ${PRODUCT_INSTALL_SH_URL} | bash`;
export const PRODUCT_INSTALL_CURL_GITHUB = `curl -fsSL ${PRODUCT_INSTALL_SH_GITHUB_URL} | bash`;
/** Prebuilt package attached to the GitHub release (works without registry publish). */
export const PRODUCT_RELEASE_TGZ_URL = `https://github.com/Solizardking/dark-clawd/releases/download/v${PACKAGE_VERSION}/x402solana-dark-clawd-${PACKAGE_VERSION}.tgz`;
export const PRODUCT_NPM_INSTALL = `npm install -g ${PACKAGE_NAME}`;
export const PRODUCT_NPM_INSTALL_TGZ = `npm install -g ${PRODUCT_RELEASE_TGZ_URL}`;
export const PRODUCT_NPX_HELP = `npx ${PACKAGE_NAME} --help`;

/** Bins linked after a successful npm install. */
export const PRODUCT_BINS = ['dark-clawd', 'clawd', 'clawd-tui'] as const;

export function detectRuntime(): string {
  const bunVer =
    typeof (globalThis as { Bun?: { version?: string } }).Bun?.version === 'string'
      ? (globalThis as { Bun: { version: string } }).Bun.version
      : null;
  if (bunVer) return `Bun ${bunVer}`;
  return `Node ${process.version}`;
}

/** Friendly first-run / welcome text for terminals and installers. */
export function formatWelcomeBanner(): string {
  const bins = PRODUCT_BINS.join(' · ');
  return [
    `🦞 ${PRODUCT_NAME} v${PACKAGE_VERSION}`,
    `   ${PRODUCT_TAGLINE}`,
    '',
    'Install (Node ≥18):',
    `  ${PRODUCT_NPM_INSTALL_TGZ}`,
    `  # registry: ${PRODUCT_NPM_INSTALL}`,
    `  # or: ${PRODUCT_INSTALL_CURL_GITHUB}`,
    '',
    'Quick start:',
    '  dark-clawd --help',
    '  dark-clawd status',
    '  dark-clawd setup',
    '  dark-clawd run',
    '',
    `Bins:    ${bins}`,
    `Hub:     ${PRODUCT_HUB_URL}`,
    `GitHub:  ${PRODUCT_GITHUB_URL}`,
    `npm:     ${PACKAGE_NAME}`,
  ].join('\n');
}

export function productInfoRecord(): Record<string, string> {
  return {
    name: PRODUCT_NAME,
    version: PACKAGE_VERSION,
    package: PACKAGE_NAME,
    runtime: detectRuntime(),
    platform: `${process.platform} ${process.arch}`,
    node: process.version,
    hub: PRODUCT_HUB_URL,
    github: PRODUCT_GITHUB_URL,
    npm: PRODUCT_NPM_INSTALL,
    tarball: PRODUCT_NPM_INSTALL_TGZ,
    install: PRODUCT_INSTALL_CURL_GITHUB,
  };
}
