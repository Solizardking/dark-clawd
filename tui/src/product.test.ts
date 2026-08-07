import { describe, expect, test } from 'bun:test';
import {
  detectRuntime,
  formatWelcomeBanner,
  PACKAGE_NAME,
  PACKAGE_VERSION,
  PRODUCT_GITHUB_URL,
  PRODUCT_HUB_URL,
  PRODUCT_INSTALL_CURL,
  PRODUCT_NAME,
  PRODUCT_NPM_INSTALL,
  productInfoRecord,
} from './product.js';

describe('product identity (first release)', () => {
  test('canonical hub, github, and npm package names', () => {
    expect(PRODUCT_NAME).toBe('Dark Clawd');
    expect(PACKAGE_NAME).toBe('@openclawdsolana/dark-clawd');
    expect(PACKAGE_VERSION).toMatch(/^\d+\.\d+\.\d+/);
    expect(PRODUCT_HUB_URL).toBe('https://cheshireterminal.ai/dark-clawd');
    expect(PRODUCT_GITHUB_URL).toBe('https://github.com/Solizardking/dark-clawd');
    expect(PRODUCT_NPM_INSTALL).toContain(PACKAGE_NAME);
    expect(PRODUCT_INSTALL_CURL).toContain('cheshireterminal.ai/api/dark-clawd/install.sh');
  });

  test('welcome banner and info are user-friendly and link product surfaces', () => {
    const banner = formatWelcomeBanner();
    expect(banner).toContain(PRODUCT_NAME);
    expect(banner).toContain(PRODUCT_HUB_URL);
    expect(banner).toContain(PRODUCT_GITHUB_URL);
    expect(banner).toContain('npm install -g');
    expect(banner).toContain('dark-clawd run');
    expect(banner).toContain('dark-clawd status');

    const info = productInfoRecord();
    expect(info.hub).toBe(PRODUCT_HUB_URL);
    expect(info.github).toBe(PRODUCT_GITHUB_URL);
    expect(info.package).toBe(PACKAGE_NAME);
    expect(detectRuntime()).toMatch(/Node|Bun/);
  });
});
