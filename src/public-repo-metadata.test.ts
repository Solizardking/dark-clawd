import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = 'https://github.com/Solizardking/openclawd-dark-clawd';

describe('public GitHub product metadata', () => {
  test('package.json repository points at public openclawd-dark-clawd', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    expect(pkg.repository?.url).toContain('openclawd-dark-clawd');
    expect(pkg.repository?.url).toContain('github.com');
    expect(pkg.license).toBe('MIT');
  });

  test('tui package.json repository points at same public repo', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'tui/package.json'), 'utf8'));
    expect(pkg.repository?.url).toContain('openclawd-dark-clawd');
  });

  test('README documents public clone URL and Dark Clawd brand', () => {
    const readme = readFileSync(join(root, 'README.md'), 'utf8');
    expect(readme).toContain(PUBLIC);
    expect(readme).toMatch(/git clone https:\/\/github\.com\/Solizardking\/openclawd-dark-clawd\.git/);
    expect(readme).toMatch(/DARK CLAWD|Dark Clawd/);
    expect(readme.toLowerCase()).toContain('forged from ralph on solana');
  });

  test('LICENSE MIT exists for public OSS', () => {
    const lic = readFileSync(join(root, 'LICENSE'), 'utf8');
    expect(lic).toMatch(/MIT License/);
  });
});
