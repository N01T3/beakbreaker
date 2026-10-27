import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PRANCHAS_SRC = '/root/.gemini/antigravity-cli/scratch/beakbreaker/docs/pranchas';
const ASSETS_DEST = '/root/.gemini/antigravity-cli/scratch/beakbreaker/apps/client/public/assets/pranchas';

if (!fs.existsSync(ASSETS_DEST)) {
  fs.mkdirSync(ASSETS_DEST, { recursive: true });
}

const PRANCHA_MAP = {
  'p01_img01.png': 'splash-pitch.webp',
  'p02_img01.png': 'cordel-pop-guide.webp',
  'p03_img01.jpeg': 'ftue-starter.webp',
  'p04_img01.png': 'fazenda-viva-backdrop.webp',
  'p07_img01.png': 'album-galos-backdrop.webp',
  'p09_img01.png': 'arena-combate-backdrop.webp',
  'p10_img01.png': 'evolucao-backdrop.webp',
  'p11_img01.png': 'santuario-arvore-backdrop.webp',
  'p12_img01.png': 'oficina-forja-backdrop.webp',
  'p13_img01.png': 'cards-cordel-backdrop.webp',
  'p14_img01.png': 'loja-arraial-backdrop.webp',
  'p15_img01.jpeg': 'bando-cla-backdrop.webp',
  'p16_img01.png': 'guerra-territorios-backdrop.webp',
  'p17_img01.jpeg': 'vitrine-social-backdrop.webp',
  'p18_img01.png': 'estrada-torre-backdrop.webp',
  'p19_img01.jpeg': 'tv-sertao-backdrop.webp',
  'p20_img01.png': 'chocadeira-corrida-backdrop.webp',
  'p21_img01.jpeg': 'labirinto-roda-backdrop.webp',
  'p22_img01.png': 'raid-colosso-backdrop.webp',
  'p23_img01.png': 'passe-divino-backdrop.webp',
  'p24_img01.jpeg': 'campeoes-sazonais-backdrop.webp',
  'p26_img01.jpeg': 'loja-vip-backdrop.webp',
};

async function processAll() {
  console.log('Converting pranchas to optimized WebP...');
  let totalBytes = 0;

  for (const [srcFile, destFile] of Object.entries(PRANCHA_MAP)) {
    const srcPath = path.join(PRANCHAS_SRC, srcFile);
    const destPath = path.join(ASSETS_DEST, destFile);

    if (fs.existsSync(srcPath)) {
      await sharp(srcPath)
        .resize(1024, null, { withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toFile(destPath);

      const stats = fs.statSync(destPath);
      totalBytes += stats.size;
      console.log(`  ✓ ${srcFile} -> ${destFile} (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      console.warn(`  ⚠ Missing source: ${srcFile}`);
    }
  }

  console.log(`\nTotal assets size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
}

processAll().catch(console.error);
