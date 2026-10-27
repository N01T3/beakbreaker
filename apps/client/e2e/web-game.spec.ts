import { test, expect } from 'playwright/test';

test.describe('BeakBreaker Web E2E — ECA Digital, FTUE, 5 Abas Cordel Pop, Arena 3v3 & Chocadeira Pity', () => {
  test('Fluxo completo E2E: Gate 18+ -> FTUE #5 -> Fazenda -> Arena 3v3 (Sinergias, Corta-Canto, PAH!) -> Loja Pix QR & Chocadeira -> PWA Bridge', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Gate 18+ (ECA Digital) e escolha do ovo no FTUE com #5 Brisa do Rio
    await expect(page.getByTestId('age-gate-modal')).toBeVisible();
    await page.getByTestId('input-birth-year').fill('1994');
    await page.getByTestId('btn-confirm-18plus').click();

    await expect(page.getByTestId('ftue-egg-selection')).toBeVisible();
    await page.getByTestId('btn-egg-2').click();
    await expect(page.getByTestId('ftue-awarded-banner')).toBeVisible();
    await expect(page.getByTestId('ftue-rooster-name')).toContainText('#5 Brisa do Rio');

    // 1B. Barra de Ponte Nativa Capacitor & PWA
    await expect(page.getByTestId('platform-bridge-bar')).toBeVisible();
    await page.getByTestId('btn-save-snapshot').click();
    await expect(page.getByTestId('snapshot-save-status')).toContainText('Progresso salvo');

    // 2. Colheita de Milho na Fazenda Viva 2.0 e Torres dos Santos Padroeiros
    await expect(page.getByTestId('tab-content-fazenda')).toBeVisible();
    const initialMilhoText = await page.getByTestId('milho-balance').textContent();
    expect(initialMilhoText).toContain('500');

    await page.getByTestId('btn-harvest-all').click();
    await expect(page.getByTestId('harvest-feedback')).toBeVisible();
    const afterHarvestText = await page.getByTestId('milho-balance').textContent();
    expect(afterHarvestText).not.toBe(initialMilhoText);

    await page.getByTestId('btn-saint-tower-2').click();
    await expect(page.getByTestId('btn-saint-tower-2')).toContainText('(Ativa)');

    // 2B. Palco Canvas Xilogravura (<canvas>), Ciclo Dia/Noite e Saque de Fazenda (2 Ondas + Trava 72h)
    await expect(page.getByTestId('cordel-stage-canvas')).toBeVisible();
    await expect(page.getByTestId('canvas-scene-label')).toContainText('Cena: Fazenda');
    await page.getByTestId('btn-cycle-daynight').click();
    await expect(page.getByTestId('canvas-scene-label')).toContainText('CREPUSCULO');

    await expect(page.getByTestId('pvp-raid-panel')).toBeVisible();
    await page.getByTestId('btn-execute-farm-raid').click();
    await expect(page.getByTestId('farm-raid-status')).toBeVisible();
    await page.getByTestId('btn-test-revenge-lock').click();

    // 3. Navegação pela aba Lutar: Arena 3v3, velocidades 1x/2x/3x, Torcida, Sinergias e Corta-Canto
    await page.getByTestId('nav-tab-Lutar').click();
    await expect(page.getByTestId('tab-content-lutar')).toBeVisible();

    await page.getByTestId('btn-speed-1x').click();
    await expect(page.getByTestId('btn-cycle-speed')).toContainText('1x');
    await page.getByTestId('btn-speed-2x').click();
    await expect(page.getByTestId('btn-cycle-speed')).toContainText('2x');
    await page.getByTestId('btn-speed-3x').click();
    await expect(page.getByTestId('btn-cycle-speed')).toContainText('3x');

    await page.getByTestId('btn-torcida').click();
    await expect(page.getByTestId('btn-torcida')).toContainText('[1]');

    await page.getByTestId('btn-start-battle-3v3').click();
    await expect(page.getByTestId('battle-result-banner')).toContainText('Resultado 3v3: Vitória Time');
    const popupsText = await page.getByTestId('xilo-popup-container').textContent();
    expect(popupsText).toContain('PAH!');

    // 3B. Painel de Sinergias e Corta-Canto (6 Ticks)
    await expect(page.getByTestId('arena-synergy-panel')).toBeVisible();
    await page.getByTestId('btn-cycle-trio').click();
    await expect(page.getByTestId('active-trio-name')).toBeVisible();
    await page.getByTestId('btn-corta-canto').click();
    await expect(page.getByTestId('corta-canto-status')).toContainText('Interrompido');

    // 4. Abas Galos (Ninhal, Santuário 24 Receitas, Orbes) e Bando (Colosso, Guerra, Labirinto)
    await page.getByTestId('nav-tab-Galos').click();
    await expect(page.getByTestId('tab-content-galos')).toBeVisible();
    await expect(page.getByTestId('album-summary-text')).toContainText('40 aves');
    await page.getByTestId('btn-refine-15').click();

    await expect(page.getByTestId('genetics-sanctuary-panel')).toBeVisible();
    await page.getByTestId('btn-toggle-golden-bar').click();
    await page.getByTestId('btn-breed-ninhal').click();
    await expect(page.getByTestId('ninhal-breed-result')).toBeVisible();
    await page.getByTestId('btn-sanctuary-fuse').click();
    await page.getByTestId('btn-recall-orbs').click();
    await expect(page.getByTestId('orb-recall-result')).toBeVisible();

    await page.getByTestId('nav-tab-Bando').click();
    await expect(page.getByTestId('tab-content-bando')).toBeVisible();
    await page.getByTestId('btn-raid-attack').click();
    await expect(page.getByTestId('colossus-status')).toContainText('12.500.000');
    await page.getByTestId('btn-advance-hero-race').click();

    await expect(page.getByTestId('liveops-festival-panel')).toBeVisible();
    await page.getByTestId('btn-labyrinth-step').click();
    await expect(page.getByTestId('labyrinth-status')).toBeVisible();
    await page.getByTestId('btn-spin-wheel').click();
    await page.getByTestId('btn-watch-tv-sertao').click();
    await expect(page.getByTestId('festival-reward-status')).toBeVisible();

    // 5. Aba Loja: Chocadeira Pity, Limite Mensal ECA e QR Code Pix Oficial
    await page.getByTestId('nav-tab-Loja').click();
    await expect(page.getByTestId('tab-content-loja')).toBeVisible();
    await expect(page.getByTestId('chocadeira-pity-counter')).toContainText('0/80');

    await page.getByTestId('btn-pull-1x').click();
    await expect(page.getByTestId('chocadeira-pity-counter')).toContainText('1/80');
    await expect(page.getByTestId('chocadeira-summon-log')).toBeVisible();

    await page.getByTestId('btn-pull-10x').click();
    await expect(page.getByTestId('chocadeira-pity-counter')).toContainText('11/80');

    await expect(page.getByTestId('spending-limit-display')).toContainText('R$ 500.00');
    await page.getByTestId('btn-buy-pix-coroas').click();
    await expect(page.getByTestId('store-tx-status')).toContainText('+345 Coroas');
    await expect(page.getByTestId('history-90-days')).toContainText('1 registro(s)');

    // 5B. Checkout Pix com QR Code SVG Xilogravura e Webhook
    await expect(page.getByTestId('pix-checkout-panel')).toBeVisible();
    await page.getByTestId('btn-generate-pix-qr').click();
    await expect(page.getByTestId('pix-qr-preview')).toBeVisible();
    await expect(page.getByTestId('pix-emv-code')).toContainText('000201');
    await page.getByTestId('btn-simulate-pix-webhook').click();
    await expect(page.getByTestId('pix-webhook-status')).toContainText('Pix confirmado');
  });

  test('E2E Novos Painéis v5.0: Ranqueada, Modificadores Climáticos, Celeiro Seguro, Enfermaria, Astral, Linhagem, Passe Divino, Mercado do Clã e Ofertas da Loja', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('input-birth-year').fill('1990');
    await page.getByTestId('btn-confirm-18plus').click();
    await page.getByTestId('btn-egg-1').click();

    // 1. Fazenda: Celeiro Seguro e Enfermaria
    await expect(page.getByTestId('barn-training-panel')).toBeVisible();
    await page.getByTestId('btn-start-training').click();
    await expect(page.getByTestId('training-status-display')).toContainText('Treino concluído');

    await expect(page.getByTestId('infirmary-potions-panel')).toBeVisible();
    await page.getByTestId('btn-apply-arnica').click();
    await expect(page.getByTestId('infirmary-feedback')).toContainText('Arnica');

    // 2. Lutar: Ranqueada e Modificadores Climáticos
    await page.getByTestId('nav-tab-Lutar').click();
    await expect(page.getByTestId('ranked-league-panel')).toBeVisible();
    await page.getByTestId('btn-simulate-ranked-match').click();
    await expect(page.getByTestId('ranked-win-streak')).toContainText('1');

    await expect(page.getByTestId('climatic-tower-panel')).toBeVisible();
    await page.getByTestId('btn-inspect-replay').click();
    await expect(page.getByTestId('replay-size-badge')).toContainText('Conforme');

    // 3. Galos: Despertar Astral e Genealogia
    await page.getByTestId('nav-tab-Galos').click();
    await expect(page.getByTestId('astral-lapidary-panel')).toBeVisible();
    await page.getByTestId('btn-star-7').click();
    await expect(page.getByTestId('astral-upgrade-info')).toContainText('7★');

    await expect(page.getByTestId('pedigree-lineage-panel')).toBeVisible();
    await page.getByTestId('btn-toggle-rooster-lineage').click();
    await expect(page.getByTestId('lineage-status-badge')).toBeVisible();

    // 4. Bando: Passe Divino, Mercado do Clã e Conquistas de Cordel
    await page.getByTestId('nav-tab-Bando').click();
    await expect(page.getByTestId('divine-pass-calendar-panel')).toBeVisible();
    await page.getByTestId('btn-claim-pass-level').click();
    await expect(page.getByTestId('pass-calendar-status')).toBeVisible();

    await expect(page.getByTestId('clan-tech-market-panel')).toBeVisible();
    await page.getByTestId('btn-donate-tech').click();
    await expect(page.getByTestId('clan-tech-market-status')).toBeVisible();

    await expect(page.getByTestId('achievements-cordel-panel')).toBeVisible();

    // 5. Loja: Ofertas de Monetização Ética
    await page.getByTestId('nav-tab-Loja').click();
    await expect(page.getByTestId('store-monetization-offers-panel')).toBeVisible();
    await expect(page.getByTestId('vault-crowns-display')).toBeVisible();
    await page.getByTestId('btn-subscribe-farmer').click();
    await expect(page.getByTestId('farmer-status-display')).toContainText('Ativo');
  });
});
