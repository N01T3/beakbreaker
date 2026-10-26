import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CLIENT_DIST = path.join(ROOT, 'apps', 'client', 'dist');
const CAP_CONFIG = path.join(ROOT, 'apps', 'client', 'capacitor.config.ts');
const MAX_BUNDLE_BYTES = 40 * 1024 * 1024; // 40 MB GDD v5.0 Cap. 16 budget

function getDirectorySize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += getDirectorySize(full);
    } else {
      total += fs.statSync(full).size;
    }
  }
  return total;
}

if (!fs.existsSync(CAP_CONFIG)) {
  console.error('[CAPACITOR ERROR] Missing apps/client/capacitor.config.ts');
  process.exit(1);
}

const capText = fs.readFileSync(CAP_CONFIG, 'utf8');
if (!capText.includes('br.com.beakbreaker.sertao') || !capText.includes("webDir: 'dist'")) {
  console.error('[CAPACITOR ERROR] Invalid appId or webDir in apps/client/capacitor.config.ts');
  process.exit(1);
}

if (!fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  console.error('[CAPACITOR ERROR] Missing apps/client/dist/index.html (run build first)');
  process.exit(1);
}

const sizeBytes = getDirectorySize(CLIENT_DIST);
const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2);
if (sizeBytes > MAX_BUNDLE_BYTES) {
  console.error(`[CAPACITOR ERROR] Bundle size ${sizeMb} MB exceeds 40 MB budget!`);
  process.exit(1);
}

console.log(
  `Capacitor Pipeline Gate (Web -> Android -> iOS) PASSED: dist=${sizeMb} MB (< 40 MB), appId=br.com.beakbreaker.sertao`,
);
