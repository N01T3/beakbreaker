import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['packages', 'apps', 'tools'];
const BANNED_REGEX = /\b(rinha|rinhadeiro|galista|espora|aposta)\b/i;

let errors = 0;

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.vue')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n').length;
      const rel = path.relative(ROOT, full);
      const isCanvas = rel.includes('apps/client/src/canvas/');
      const maxLines = isCanvas ? 150 : 250;
      if (lines > maxLines) {
        console.error(`[SIZE VIOLATION] ${rel}: ${lines} lines (max ${maxLines})`);
        errors++;
      }
      const match = content.match(BANNED_REGEX);
      if (match) {
        console.error(`[LEGAL VIOLATION Lei 9.605/98] ${rel}: found banned term "${match[0]}"`);
        errors++;
      }
    }
  }
}

for (const d of SCAN_DIRS) walk(path.join(ROOT, d));

if (errors > 0) {
  process.exit(1);
}
console.log('Legal (Lei 9.605/98) & Component Size Gate PASSED (0 violations).');
