import { test } from 'playwright/test';

const SCREENSHOT_DIR = '/root/.gemini/antigravity-cli/brain/69dafa08-b52a-4385-8a27-34114279919b/screenshots';

test('Capture Screenshots of All 5 Tabs with New v5.0 Systems', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 900 });
  await page.goto('/');

  await page.getByTestId('input-birth-year').fill('1990');
  await page.getByTestId('btn-confirm-18plus').click();
  await page.getByTestId('btn-egg-1').click();

  // Tab 1: Fazenda
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02_fazenda_stage.png`, fullPage: false });

  // Tab 2: Lutar
  await page.getByTestId('nav-tab-Lutar').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03_arena_combate.png`, fullPage: false });

  // Tab 3: Galos
  await page.getByTestId('nav-tab-Galos').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04_album_galos.png`, fullPage: false });

  // Tab 4: Bando
  await page.getByTestId('nav-tab-Bando').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/06_bando_passe_conquistas.png`, fullPage: false });

  // Tab 5: Loja
  await page.getByTestId('nav-tab-Loja').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/05_loja_pix_chocadeira.png`, fullPage: false });
});
