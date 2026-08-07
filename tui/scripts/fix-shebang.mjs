#!/usr/bin/env node
/**
 * Rewrite shipped CLI shebang so npm-linked bins run under Node.
 * Bun's `bun build --target node` still emits `#!/usr/bin/env bun`.
 */
import { readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const targets = process.argv.slice(2);
const files = targets.length > 0 ? targets : [join(root, 'dist/cli.js')];

let fixed = 0;
for (const file of files) {
  if (!existsSync(file)) {
    console.error(`fix-shebang: missing ${file}`);
    process.exit(1);
  }
  const original = readFileSync(file, 'utf8');
  let next = original;
  // Prefer env node for portability across npm global installs
  next = next.replace(/^#!\/usr\/bin\/env bun\b[^\n]*/, '#!/usr/bin/env node');
  next = next.replace(/^#!\/usr\/bin\/bun\b[^\n]*/, '#!/usr/bin/env node');
  if (next === original) {
    if (!/^#!/m.test(original)) {
      next = `#!/usr/bin/env node\n${original}`;
    } else if (!/^#!\/usr\/bin\/env node/m.test(original)) {
      // Unknown shebang — force node for published bins
      next = original.replace(/^#![^\n]*/, '#!/usr/bin/env node');
    }
  }
  if (next !== original) {
    writeFileSync(file, next, 'utf8');
    try {
      chmodSync(file, 0o755);
    } catch {
      // best-effort executable bit
    }
    fixed += 1;
    console.log(`fix-shebang: node shebang → ${file}`);
  } else {
    console.log(`fix-shebang: already node-ready → ${file}`);
  }
}

process.exit(0);
