import { test } from 'playwright/test';

const SCREENSHOT_DIR = '/root/.gemini/antigravity-cli/brain/69dafa08-b52a-4385-8a27-34114279919b/screenshots';

test('Capture Screenshots of All Pranchas and Systems', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 900 });
  await page.goto('/');

  // FTUE 18+ & Starter
  await page.getByTestId('input-birth-year').fill('1990');
  await page.getByTestId('btn-confirm-18plus').click();
  await page.getByTestId('btn-egg-1').click();

  // Tab 1: Fazenda Viva 2.0 (Prancha 04) - Vila Isométrica
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02_fazenda_stage.png`, fullPage: false });

  // Tab 1 Subtab: Treino & Botica
  const btnFarmTreino = page.getByTestId('farm-subtab-estruturas');
  if (await btnFarmTreino.isVisible()) {
    await btnFarmTreino.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02b_fazenda_treino_botica.png`, fullPage: false });
  }

  // Tab 1 Subtab: Defesa & Predadores
  const btnFarmDefesa = page.getByTestId('farm-subtab-defesa');
  if (await btnFarmDefesa.isVisible()) {
    await btnFarmDefesa.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02c_fazenda_defesa_predadores.png`, fullPage: false });
  }

  // Retorna para Vila
  const btnFarmVila = page.getByTestId('farm-subtab-vila');
  if (await btnFarmVila.isVisible()) await btnFarmVila.click();

  // Tab 2: Lutar / Arena 3v3 (Prancha 09)
  await page.getByTestId('nav-tab-Lutar').click();
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03_arena_combate.png`, fullPage: false });

  // Tab 2 Subtab: Estrada do Sertão & Torre (Prancha 18)
  const btnTorre = page.getByTestId('btn-select-mode-estrada-torre');
  if (await btnTorre.isVisible()) {
    await btnTorre.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03b_estrada_torre.png`, fullPage: false });
  }

  // Tab 2 Subtab: TV Sertão & Replay (Prancha 19)
  const btnTVSertao = page.getByTestId('btn-select-mode-tv-sertao');
  if (await btnTVSertao.isVisible()) {
    await btnTVSertao.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03c_tv_sertao.png`, fullPage: false });
  }

  // Tab 2 Subtab: Modo História - Diálogos de Cordel
  const btnHistoria = page.getByTestId('btn-select-mode-historia');
  if (await btnHistoria.isVisible()) {
    await btnHistoria.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03d_modo_historia.png`, fullPage: false });
  }

  // Tab 3: Galos - Plantel (Prancha 07)
  await page.getByTestId('nav-tab-Galos').click();
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04_album_galos.png`, fullPage: false });

  // Tab 3 Subtab: Evolução Ramificada (Prancha 10)
  const btnEvolucao = page.getByTestId('subtab-evolucao');
  if (await btnEvolucao.isVisible()) {
    await btnEvolucao.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04b_evolucao_ramificada.png`, fullPage: false });
  }

  // Tab 3 Subtab: Oficina +15 & Forja (Prancha 12)
  const btnOficina = page.getByTestId('subtab-oficina');
  if (await btnOficina.isVisible()) {
    await btnOficina.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04c_oficina_forja.png`, fullPage: false });
  }

  // Tab 3 Subtab: Árvore da Vida & Orbes (Prancha 11)
  const btnArvore = page.getByTestId('subtab-arvore');
  if (await btnArvore.isVisible()) {
    await btnArvore.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04e_arvore_da_vida.png`, fullPage: false });
  }

  // Tab 3 Subtab: Grimório 24 Receitas do Santuário (Prancha 11)
  const btnGrimorio = page.getByTestId('subtab-grimorio');
  if (await btnGrimorio.isVisible()) {
    await btnGrimorio.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04d_grimorio_santuario.png`, fullPage: false });
  }

  // Tab 4: Bando & Passe (Pranchas 15, 16, 17, 21)
  await page.getByTestId('nav-tab-Bando').click();
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${SCREENSHOT_DIR}/06_bando_passe_conquistas.png`, fullPage: false });

  // Tab 4 Subtab: Passe & Eventos
  const btnPasse = page.getByTestId('clan-subtab-passe');
  if (await btnPasse.isVisible()) {
    await btnPasse.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06b_bando_passe_eventos.png`, fullPage: false });
  }

  // Tab 4 Subtab: Labirinto & Roda
  const btnLabirinto = page.getByTestId('clan-subtab-labirinto');
  if (await btnLabirinto.isVisible()) {
    await btnLabirinto.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06c_bando_labirinto_roda.png`, fullPage: false });
  }

  // Tab 4 Subtab: Vitrine Social
  const btnVitrine = page.getByTestId('clan-subtab-vitrine');
  if (await btnVitrine.isVisible()) {
    await btnVitrine.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06d_bando_vitrine_social.png`, fullPage: false });
  }

  // Tab 5: Loja PIX (Prancha 14)
  await page.getByTestId('nav-tab-Loja').click();
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${SCREENSHOT_DIR}/05_loja_pix_chocadeira.png`, fullPage: false });

  // Tab 5 Subtab: Chocadeira Sagrada Pity (Prancha 20)
  const btnChocadeira = page.getByTestId('tab-btn-chocadeira');
  if (await btnChocadeira.isVisible()) {
    await btnChocadeira.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05b_chocadeira_pity.png`, fullPage: false });
  }

  // Tab 5 Subtab: Corrida de Heróis 18 Voltas (Prancha 20)
  const btnCorrida = page.getByTestId('tab-btn-corrida');
  if (await btnCorrida.isVisible()) {
    await btnCorrida.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05c_corrida_herois.png`, fullPage: false });
  }
});
