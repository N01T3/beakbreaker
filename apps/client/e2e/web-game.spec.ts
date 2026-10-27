import { test, expect } from 'playwright/test';

test.describe('BeakBreaker Web E2E — ECA Digital, FTUE, 5 Abas, Arena 3v3 & Novos Painéis', () => {
  test('Fluxo completo E2E: Gate 18+ -> FTUE -> Fazenda -> Arena 3v3 -> Loja Pix QR', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('age-gate-modal')).toBeVisible();
    await page.getByTestId('input-birth-year').fill('1994');
    await page.getByTestId('btn-confirm-18plus').click();

    await expect(page.getByTestId('ftue-egg-selection')).toBeVisible();
    await page.getByTestId('btn-egg-2').click();
    await expect(page.getByTestId('ftue-awarded-banner')).toBeVisible();

    await expect(page.getByTestId('platform-bridge-bar')).toBeVisible();
    await page.getByTestId('btn-save-snapshot').click();
    await expect(page.getByTestId('snapshot-save-status')).toContainText('Progresso salvo');

    await expect(page.getByTestId('tab-content-fazenda')).toBeVisible();
    await page.getByTestId('btn-harvest-all').click();
    await expect(page.getByTestId('harvest-feedback')).toBeVisible();
    await page.getByTestId('btn-saint-tower-2').click();
    await expect(page.getByTestId('btn-saint-tower-2')).toContainText('(Ativa)');

    await expect(page.getByTestId('cordel-stage-canvas')).toBeVisible();
    await page.getByTestId('btn-cycle-daynight').click();
    await expect(page.getByTestId('pvp-raid-panel')).toBeVisible();
    await page.getByTestId('btn-execute-farm-raid').click();
    await expect(page.getByTestId('farm-raid-status')).toBeVisible();

    await page.getByTestId('nav-tab-Lutar').click();
    await expect(page.getByTestId('tab-content-lutar')).toBeVisible();
    await page.getByTestId('btn-speed-2x').click();
    await expect(page.getByTestId('btn-cycle-speed')).toContainText('2x');
    await page.getByTestId('btn-torcida').click();
    await expect(page.getByTestId('btn-torcida')).toContainText('[1]');
    await page.getByTestId('btn-start-battle-3v3').click();
    await expect(page.getByTestId('battle-result-banner')).toContainText('Resultado 3v3: Vitória Time');

    await expect(page.getByTestId('arena-synergy-panel')).toBeVisible();
    await page.getByTestId('btn-cycle-trio').click();
    await page.getByTestId('btn-corta-canto').click();
    await expect(page.getByTestId('corta-canto-status')).toContainText('Interrompido');

    await page.getByTestId('nav-tab-Galos').click();
    await expect(page.getByTestId('tab-content-galos')).toBeVisible();
    await page.getByTestId('btn-refine-15').click();
    await expect(page.getByTestId('genetics-sanctuary-panel')).toBeVisible();
    await page.getByTestId('btn-breed-ninhal').click();
    await expect(page.getByTestId('ninhal-breed-result')).toBeVisible();
    await page.getByTestId('btn-recall-orbs').click();

    await page.getByTestId('nav-tab-Bando').click();
    await expect(page.getByTestId('tab-content-bando')).toBeVisible();
    await page.getByTestId('btn-raid-attack').click();
    await expect(page.getByTestId('colossus-status')).toContainText('12.500.000');
    await page.getByTestId('btn-advance-hero-race').click();
    await expect(page.getByTestId('liveops-festival-panel')).toBeVisible();
    await page.getByTestId('btn-labyrinth-step').click();
    await page.getByTestId('btn-spin-wheel').click();

    await page.getByTestId('nav-tab-Loja').click();
    await expect(page.getByTestId('tab-content-loja')).toBeVisible();
    await page.getByTestId('btn-pull-1x').click();
    await expect(page.getByTestId('chocadeira-pity-counter')).toContainText('1/80');
    await page.getByTestId('btn-buy-pix-coroas').click();
    await expect(page.getByTestId('store-tx-status')).toContainText('+345 Coroas');
    await expect(page.getByTestId('pix-checkout-panel')).toBeVisible();
    await page.getByTestId('btn-generate-pix-qr').click();
    await expect(page.getByTestId('pix-qr-preview')).toBeVisible();
    await page.getByTestId('btn-simulate-pix-webhook').click();
    await expect(page.getByTestId('pix-webhook-status')).toContainText('Pix confirmado');
  });

  test('E2E Novos Painéis v5.0: Modos Alternativos, Ranking UF, Desafios Cordel, Predadores & Fundo', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('input-birth-year').fill('1990');
    await page.getByTestId('btn-confirm-18plus').click();
    await page.getByTestId('btn-egg-1').click();

    // 1. Fazenda: Celeiro, Enfermaria, Desafios de Cordel & Defesa contra Predadores
    await expect(page.getByTestId('barn-training-panel')).toBeVisible();
    await page.getByTestId('btn-start-training').click();
    await expect(page.getByTestId('infirmary-potions-panel')).toBeVisible();
    await page.getByTestId('btn-apply-arnica').click();
    await expect(page.getByTestId('cordel-challenges-predators-panel')).toBeVisible();
    await page.getByTestId('button-solve-cordel-puzzle').click();
    await expect(page.getByTestId('cordel-folheto-card')).toContainText('Desafio Superado com Honra');
    await page.getByTestId('button-repel-predator').click();
    await expect(page.getByTestId('predator-alert-banner')).toContainText('espantado com sucesso');

    // 2. Lutar: Ranqueada, Modificadores Climáticos & Modos Alternativos (Duelo 1x1, Nivelada, Rei, Torneio)
    await page.getByTestId('nav-tab-Lutar').click();
    await expect(page.getByTestId('ranked-league-panel')).toBeVisible();
    await page.getByTestId('btn-simulate-ranked-match').click();
    await expect(page.getByTestId('climatic-tower-panel')).toBeVisible();
    await page.getByTestId('btn-inspect-replay').click();
    await expect(page.getByTestId('alternative-combat-modes-panel')).toBeVisible();
    await page.getByTestId('button-duelo-1x1').click();
    await expect(page.getByTestId('alt-modes-result')).toContainText('Duelo 1x1 Amistoso Finalizado');
    await page.getByTestId('button-arena-nivelada').click();
    await expect(page.getByTestId('alt-modes-result')).toContainText('Arena Nivelada Balanceada');
    await page.getByTestId('button-rei-terreiro').click();
    await expect(page.getByTestId('alt-modes-result')).toContainText('Rei do Terreiro');
    await page.getByTestId('button-torneio-arraial').click();
    await expect(page.getByTestId('alt-modes-result')).toContainText('Torneio do Arraial');

    // 3. Galos: Despertar Astral e Genealogia
    await page.getByTestId('nav-tab-Galos').click();
    await expect(page.getByTestId('astral-lapidary-panel')).toBeVisible();
    await page.getByTestId('btn-star-7').click();
    await expect(page.getByTestId('pedigree-lineage-panel')).toBeVisible();
    await page.getByTestId('btn-toggle-rooster-lineage').click();

    // 4. Bando: Passe Divino, Mercado do Clã e Ranking UF com Vitrine do Jogador
    await page.getByTestId('nav-tab-Bando').click();
    await expect(page.getByTestId('divine-pass-calendar-panel')).toBeVisible();
    await page.getByTestId('btn-claim-pass-level').click();
    await expect(page.getByTestId('clan-tech-market-panel')).toBeVisible();
    await page.getByTestId('btn-donate-tech').click();
    await expect(page.getByTestId('uf-ranking-profile-panel')).toBeVisible();
    await expect(page.getByTestId('player-showcase-trio')).toContainText('Supremo Sertão');
    await expect(page.getByTestId('uf-ranking-table')).toBeVisible();
    await page.getByTestId('button-visit-friend-farm').click();
    await expect(page.getByTestId('friendship-bonus-result')).toContainText('Bônus de Amizade Coletado');

    // 5. Loja: Monetização Ética, Fundo de Crescimento e Loteria Semanal da Vila
    await page.getByTestId('nav-tab-Loja').click();
    await expect(page.getByTestId('store-monetization-offers-panel')).toBeVisible();
    await page.getByTestId('btn-subscribe-farmer').click();
    await expect(page.getByTestId('growth-fund-lottery-panel')).toBeVisible();
    await page.getByTestId('button-claim-fund-tier').click();
    await expect(page.getByTestId('growth-fund-lottery-panel')).toContainText('Resgate realizado');
    await page.getByTestId('button-buy-lottery-ticket').click();
    await expect(page.getByTestId('village-lottery-status')).toContainText('3/7 bilhetes');
    await page.getByTestId('button-simulate-lottery-draw').click();
    await expect(page.getByTestId('village-lottery-status')).toContainText('Sorteio de Domingo Realizado');
  });
});
