import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/root/.gemini/antigravity-cli/brain/69dafa08-b52a-4385-8a27-34114279919b/screenshots';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function main() {
  console.log('Conectando ao servidor em http://127.0.0.1:4173/...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 980, height: 1250 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  try {
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });

    // 1. Tela Inicial FTUE & Gate 18+
    console.log('Capturando Tela 1: FTUE & Gate 18+...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_ftue_portal.png'), fullPage: false });

    // Passa pelo Gate 18+ e seleciona ovo do FTUE
    await page.getByTestId('input-birth-year').fill('1994');
    await page.getByTestId('btn-confirm-18plus').click();
    await page.getByTestId('btn-egg-2').click();
    await page.waitForTimeout(500);

    // 2. Tela da Fazenda Viva 2.0 (Canvas Xilogravura + Perches)
    console.log('Capturando Tela 2: Fazenda Viva 2.0 (Canvas Stage)...');
    await page.getByTestId('btn-cycle-daynight').click(); // ativa Crepúsculo
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_fazenda_stage.png'), fullPage: false });

    // 3. Tela da Arena 3v3 (Combate, Sinergias e Corta-Canto)
    console.log('Capturando Tela 3: Arena de Duelo 3v3...');
    await page.getByTestId('nav-tab-Lutar').click();
    await page.getByTestId('btn-start-battle-3v3').click();
    await page.getByTestId('btn-corta-canto').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_arena_combate.png'), fullPage: false });

    // 4. Tela dos Galos (Álbum Oficial 40 Galos, Ninhal e Santuário)
    console.log('Capturando Tela 4: Álbum dos 40 Galos & Genética...');
    await page.getByTestId('nav-tab-Galos').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_album_galos.png'), fullPage: false });

    // 5. Tela da Loja & Chocadeira (Pity 80, QR Code Pix SVG)
    console.log('Capturando Tela 5: Chocadeira Real & Checkout Pix...');
    await page.getByTestId('nav-tab-Loja').click();
    await page.getByTestId('btn-pull-10x').click();
    await page.getByTestId('btn-generate-pix-qr').click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_loja_pix_chocadeira.png'), fullPage: false });

    console.log('Todas as 5 capturas salvas com sucesso em:', ARTIFACT_DIR);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
