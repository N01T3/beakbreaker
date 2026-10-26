import { test, expect } from 'playwright/test';

test.describe('BeakBreaker Web E2E — ECA Digital, FTUE, 5 Abas Cordel Pop, Arena 3v3 & Chocadeira Pity', () => {
  test('Fluxo completo E2E: Gate 18+ -> FTUE #5 Brisa do Rio -> 5 Abas -> Colheita -> Arena 3v3 (1x/2x/3x, Torcida, PAH!) -> Chocadeira Pity & Limite Mensal', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Aprovação no Gate 18+ (ECA Digital) e escolha do ovo no FTUE com Vô Tonho recebendo #5 Brisa do Rio
    await expect(page.getByTestId('age-gate-modal')).toBeVisible();
    await page.getByTestId('input-birth-year').fill('1994');
    await page.getByTestId('btn-confirm-18plus').click();

    await expect(page.getByTestId('ftue-egg-selection')).toBeVisible();
    await page.getByTestId('btn-egg-2').click();

    await expect(page.getByTestId('ftue-awarded-banner')).toBeVisible();
    await expect(page.getByTestId('ftue-rooster-name')).toContainText('#5 Brisa do Rio');

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

    // 3. Navegação pela aba Lutar: Arena 3v3, velocidades 1x -> 2x -> 3x, Torcida e balão "PAH!"
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

    // 4. Navegação pelas abas Galos e Bando
    await page.getByTestId('nav-tab-Galos').click();
    await expect(page.getByTestId('tab-content-galos')).toBeVisible();
    await expect(page.getByTestId('album-summary-text')).toContainText('40 aves');
    await page.getByTestId('btn-refine-15').click();

    await page.getByTestId('nav-tab-Bando').click();
    await expect(page.getByTestId('tab-content-bando')).toBeVisible();
    await page.getByTestId('btn-raid-attack').click();
    await expect(page.getByTestId('colossus-status')).toContainText('12.500.000');
    await page.getByTestId('btn-advance-hero-race').click();

    // 5. Aba Loja: Disparo de tiro na Chocadeira atualizando Pity (X/80) e Limite Mensal de Gastos (ECA Digital)
    await page.getByTestId('nav-tab-Loja').click();
    await expect(page.getByTestId('tab-content-loja')).toBeVisible();
    await expect(page.getByTestId('chocadeira-pity-counter')).toContainText('0/80');

    await page.getByTestId('btn-pull-1x').click();
    await expect(page.getByTestId('chocadeira-pity-counter')).toContainText('1/80');

    await page.getByTestId('btn-pull-10x').click();
    await expect(page.getByTestId('chocadeira-pity-counter')).toContainText('11/80');

    await expect(page.getByTestId('spending-limit-display')).toContainText('R$ 500.00');
    await page.getByTestId('btn-buy-pix-coroas').click();
    await expect(page.getByTestId('store-tx-status')).toContainText('+345 Coroas');
    await expect(page.getByTestId('history-90-days')).toContainText('1 registro(s)');
  });
});
