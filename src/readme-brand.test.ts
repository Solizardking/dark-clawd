/**
 * Structural proof that the shipped root README is Dark Clawd branded,
 * keeps the Ralph-on-Solana lineage credit, and embeds a real animated hero.
 */
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readmePath = join(root, 'README.md');
const heroSvgPath = join(root, 'docs/assets/dark-clawd-hero.svg');

describe('README brand', () => {
  test('root README exists and is Dark Clawd product surface', () => {
    const text = readFileSync(readmePath, 'utf8');

    // Product name
    expect(text).toMatch(/DARK CLAWD/i);
    expect(text).toMatch(/Dark Clawd/);

    // Required lineage credit
    expect(text.toLowerCase()).toContain('forged from ralph on solana');

    // Primary title is not the old product heading
    expect(text).not.toMatch(/^#\s*DARK RALPH\b/m);

    // Hero / ops mock is Clawd-forward
    expect(text).toMatch(/DARK CLAWD ● OPERATIONAL/);

    // Command matrix uses clawd entrypoints
    expect(text).toMatch(/\bclawd\b/);
    expect(text).toMatch(/\bdark-clawd\b/);
  });

  test('README still documents Ralph lineage artifacts honestly', () => {
    const text = readFileSync(readmePath, 'utf8');
    // Agent prompt file keeps historical name
    expect(text).toContain('RALPH.md');
    // Workspace path may still be dark-ralph
    expect(text).toMatch(/dark-ralph/);
  });

  test('hero SVG is in-repo, referenced from README, and truly animated', () => {
    const readme = readFileSync(readmePath, 'utf8');
    // README must reference the stable in-repo asset path
    expect(readme).toMatch(/docs\/assets\/dark-clawd-hero\.svg/);
    expect(existsSync(heroSvgPath)).toBe(true);

    const svg = readFileSync(heroSvgPath, 'utf8');
    // Product + lineage on the asset itself
    expect(svg).toMatch(/DARK CLAWD/);
    expect(svg.toLowerCase()).toContain('forged from ralph on solana');

    // Animation primitives (SMIL and/or CSS keyframes) — not a static dump
    const hasSmil =
      /<animate[\s>]/.test(svg) ||
      /<animateTransform[\s>]/.test(svg) ||
      /<animateColor[\s>]/.test(svg);
    const hasCssKeyframes = /@keyframes\s+\w+/.test(svg) || /animation\s*:/.test(svg);
    expect(hasSmil || hasCssKeyframes).toBe(true);
    // Require SMIL specifically so GitHub <img> path still animates without CSS-in-img quirks
    expect(hasSmil).toBe(true);
    expect((svg.match(/<animate[\s>]/g) || []).length + (svg.match(/<animateTransform[\s>]/g) || []).length).toBeGreaterThan(5);
  });
});
