import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = 'https://github.com/Solizardking/dark-clawd';
const HUB = 'https://cheshireterminal.ai/dark-clawd';

describe('public GitHub + Cheshire product metadata', () => {
  test('package.json repository points at public dark-clawd repo', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(pkg.repository?.url).toContain('Solizardking/dark-clawd');
    expect(pkg.repository?.url).toContain('github.com');
    expect(pkg.homepage).toBe(HUB);
    expect(pkg.license).toBe('MIT');
  });

  test('tui package.json repository + homepage match release surfaces', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'tui/package.json'), 'utf8'));
    expect(pkg.repository?.url).toContain('Solizardking/dark-clawd');
    expect(pkg.homepage).toBe(HUB);
    expect(pkg.bugs?.url).toContain('Solizardking/dark-clawd/issues');
    expect(pkg.name).toBe('@x402solana/dark-clawd');
  });

  test('README documents public clone URL, hub, and Dark Clawd brand', () => {
    const readme = readFileSync(join(root, 'README.md'), 'utf8');
    expect(readme).toContain(PUBLIC);
    expect(readme).toContain(HUB);
    expect(readme).toMatch(/git clone https:\/\/github\.com\/Solizardking\/dark-clawd\.git/);
    expect(readme).toMatch(/DARK CLAWD|Dark Clawd/);
    expect(readme).toMatch(/@x402solana\/dark-clawd|x402solana-dark-clawd-1\.0\.0\.tgz/);
    expect(readme.toLowerCase()).toContain('forged from ralph on solana');
  });

  test('LICENSE MIT exists for public OSS', () => {
    const lic = readFileSync(join(root, 'LICENSE'), 'utf8');
    expect(lic).toMatch(/MIT License/);
  });
});
