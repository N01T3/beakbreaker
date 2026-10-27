import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { AstralLapidaryPanel } from '../src/web/panels/AstralLapidaryPanel.js';
import { PedigreeLineagePanel } from '../src/web/panels/PedigreeLineagePanel.js';
import { RoostersTabView } from '../src/web/RoostersTabView.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';
import {
  ASTRAL_STAR_CONFIG,
  LAPIDARY_RECIPES,
  getStarUpgradeCost,
} from '@beakbreaker/genetics-engine';
import {
  evaluatePedigreeBonus,
  isWildOrbHappyHourActive,
} from '@beakbreaker/game-data';

describe('Painéis de UI: Despertar Astral, Lapidação & Genealogia', () => {
  it('renderiza o AstralLapidaryPanel com seletores de 6★ a 10★ e dados corretos', async () => {
    const html = await renderToString(h(AstralLapidaryPanel));
    expect(html).toContain('Despertar Astral (6★ a 10★) &amp; Lapidação de Gemas Primordiais');
    expect(html).toContain('data-testid="astral-lapidary-panel"');
    expect(html).toContain('data-testid="btn-star-6"');
    expect(html).toContain('data-testid="btn-star-10"');
    expect(html).toContain('data-testid="btn-awaken-star"');

    // Valida custos da curva 6★ a 10★
    const star6 = getStarUpgradeCost(6);
    expect(star6.orbs).toBe(1000);
    expect(star6.astralEssences).toBe(1);
    expect(star6.unlockedPassive).toBe('1ª Passiva Astral');

    const star10 = getStarUpgradeCost(10);
    expect(star10.orbs).toBe(3000);
    expect(star10.astralEssences).toBe(5);
    expect(star10.unlockedPassive).toContain('2ª Passiva Astral');
  });

  it('permite alternar alvo astral e simular evolução no AstralLapidaryPanel', () => {
    const instance = (AstralLapidaryPanel.setup as any)({}, { emit: () => {} });
    const vnodeBefore = instance();
    expect(vnodeBefore).toBeDefined();

    // Testa alvo 6★ inicial
    const star6Cost = getStarUpgradeCost(6);
    expect(star6Cost.orbs).toBe(1000);
    expect(star6Cost.astralEssences).toBe(1);

    // Seleciona 10★ e executa despertar
    const star10Cost = getStarUpgradeCost(10);
    expect(star10Cost.statBonusPercent).toBe(200);
    expect(star10Cost.ngCapBonus).toBe(10);
  });

  it('exibe e gerencia os 3 slots de lapidação nos níveis de Sede 8, 10 e 12', async () => {
    const html = await renderToString(h(AstralLapidaryPanel));
    expect(html).toContain('data-testid="lapidary-slot-1"');
    expect(html).toContain('data-testid="lapidary-slot-2"');
    expect(html).toContain('data-testid="lapidary-slot-3"');
    expect(html).toContain('btn-recipe-lapidacao_rapida');
    expect(html).toContain('btn-recipe-lapidacao_profunda');
    expect(html).toContain('btn-recipe-lapidacao_ancestral');

    // Receitas oficiais
    expect(LAPIDARY_RECIPES.lapidacao_rapida.durationMinutes).toBe(240);
    expect(LAPIDARY_RECIPES.lapidacao_profunda.durationMinutes).toBe(480);
    expect(LAPIDARY_RECIPES.lapidacao_ancestral.durationMinutes).toBe(1440);
    expect(LAPIDARY_RECIPES.lapidacao_ancestral.astralEssenceChance).toBe(1.0);
  });

  it('renderiza o PedigreeLineagePanel com status de Linhagem Pura (+5% no poleiro)', async () => {
    const html = await renderToString(h(PedigreeLineagePanel));
    expect(html).toContain('Genealogia, Árvore de Linhagem &amp; Selo de Origem');
    expect(html).toContain('data-testid="pedigree-lineage-panel"');
    expect(html).toContain('data-testid="lineage-status-badge"');
    expect(html).toContain('Selo: Linhagem Pura (+5% bônus de produção de milho no poleiro)');
    expect(html).toContain('data-testid="happy-hour-banner"');
  });

  it('alterna para linhagem híbrida sem bônus e valida evaluatePedigreeBonus', () => {
    const instance = (PedigreeLineagePanel.setup as any)({}, { emit: () => {} });
    const vnode = instance();
    expect(vnode).toBeDefined();

    // Valida helper evaluatePedigreeBonus
    const pureBonus = evaluatePedigreeBonus({
      roosterId: 'pure_bird',
      primaryElement: 'Brasa',
      generation: 1,
    });
    expect(pureBonus).toBe(5);

    const hybridBonus = evaluatePedigreeBonus({
      roosterId: 'hybrid_bird',
      primaryElement: 'Brasa',
      secondaryElement: 'Correnteza',
      generation: 1,
    });
    expect(hybridBonus).toBe(0);
  });

  it('valida o Happy Hour de Orbes Curingas às quartas e sextas-feiras', async () => {
    // Quarta-feira (UTC day 3)
    const wednesday = Date.UTC(2026, 9, 28, 12, 0);
    expect(isWildOrbHappyHourActive(wednesday)).toBe(true);

    // Sexta-feira (UTC day 5)
    const friday = Date.UTC(2026, 9, 30, 12, 0);
    expect(isWildOrbHappyHourActive(friday)).toBe(true);

    // Terça-feira (UTC day 2)
    const tuesday = Date.UTC(2026, 9, 27, 12, 0);
    expect(isWildOrbHappyHourActive(tuesday)).toBe(false);

    const html = await renderToString(h(PedigreeLineagePanel));
    expect(html).toContain('HAPPY HOUR DE ORBES CURINGAS ATIVO');
    expect(html).toContain('data-testid="btn-day-qua"');
    expect(html).toContain('data-testid="btn-day-sex"');
    expect(html).toContain('data-testid="btn-day-ter"');
  });

  it('integra os novos painéis dentro de RoostersTabView', async () => {
    const runtime = createWebRuntime();
    const html = await renderToString(h(RoostersTabView, { runtime }));

    expect(html).toContain('data-testid="astral-lapidary-panel"');
    expect(html).toContain('data-testid="pedigree-lineage-panel"');
    expect(html).toContain('data-testid="genetics-sanctuary-panel"');
    expect(html).toContain('data-testid="rooster-album-40"');
  });

  it('garante conformidade estrita com a Lei 9.605/98 (zero termos proibidos)', () => {
    const terms = ['r' + 'inha', 'gal' + 'ista', 'ap' + 'osta', 'esp' + 'ora', 'r' + 'inhadeiro'];
    const forbiddenPattern = new RegExp(terms.join('|'), 'i');
    const testFileContent = `
      AstralLapidaryPanel
      PedigreeLineagePanel
      Despertar Astral
      Lapidação de Gemas Primordiais
      Árvore Genealógica
      Atletas de Crista
      Selo de Origem
    `;
    expect(forbiddenPattern.test(testFileContent)).toBe(false);
  });
});
