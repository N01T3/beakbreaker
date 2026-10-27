import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  BarnTrainingPanel,
  calculateLazyTraining,
  calculateTrainingCost,
} from '../src/web/panels/BarnTrainingPanel.js';
import { InfirmaryPotionsPanel } from '../src/web/panels/InfirmaryPotionsPanel.js';
import { FarmTabView } from '../src/web/FarmTabView.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';
import {
  BARN_PROTECTION_TABLE,
  calculateAstralNgBonus,
  calculateMaxNg,
} from '@beakbreaker/genetics-engine';
import {
  BASE_REST_TIME_MINUTES,
  INFIRMARY_POTIONS,
  STRAW_BED_REST_TIME_MINUTES,
  getInfirmaryBedCapacity,
} from '@beakbreaker/game-data';

describe('Painéis de UI da Fazenda — Celeiro, Centro de Treinamento & Enfermaria', () => {
  describe('BarnTrainingPanel (Celeiro & Centro de Treinamento)', () => {
    it('calcula custo de treino e ganho de NG lazy corretamente', () => {
      // 30 min @ NG 5 (50 milho/min) = 1500 milho
      const cost = calculateTrainingCost(5, 30);
      expect(cost).toBe(1500);

      // Treino de NG 5 com milho suficiente para subir de nível
      const result = calculateLazyTraining(5, 60, 50_000, 3, 0);
      expect(result.initialNg).toBe(5);
      expect(result.finalNg).toBeGreaterThanOrEqual(5);
      expect(result.maxNg).toBe(15);
      expect(result.cornConsumed).toBeGreaterThan(0);
    });

    it('valida teto de NG da Sede (1 até 12) e bônus astral', () => {
      expect(calculateMaxNg(1, 0)).toBe(5);
      expect(calculateMaxNg(12, 0)).toBe(60);
      expect(calculateMaxNg(12, 10)).toBe(70);
      expect(calculateAstralNgBonus(10)).toBe(10);
    });

    it('valida tabela de proteção do celeiro de 2k até 5M milho', () => {
      expect(BARN_PROTECTION_TABLE[0]?.sedeLevel).toBe(1);
      expect(BARN_PROTECTION_TABLE[0]?.protectedCorn).toBe(2_000);
      const sede12 = BARN_PROTECTION_TABLE.find((b) => b.sedeLevel === 12);
      expect(sede12?.protectedCorn).toBe(5_000_000);
      expect(sede12?.maxCapacity).toBe(35_000_000);
    });

    it('renderiza o painel do celeiro e treino com tokens cordel', async () => {
      const html = await renderToString(
        h(BarnTrainingPanel, {
          initialSedeLevel: 1,
          initialStoredCorn: 25_000,
          initialNg: 4,
          initialStars: 0,
        }),
      );

      expect(html).toContain('data-testid="barn-training-panel"');
      expect(html).toContain('Celeiro Seguro &amp; Centro de Treinamento');
      expect(html).toContain('2,000 Milho');
      expect(html).toContain('data-testid="btn-calc-barn-harvest"');
      expect(html).toContain('data-testid="btn-start-training"');
      expect(html).toContain('data-testid="btn-sede-12-preview"');
    });

    it('executa ações no setup do componente BarnTrainingPanel', () => {
      const instance = BarnTrainingPanel.setup?.(
        { initialSedeLevel: 1, initialStoredCorn: 50_000, initialNg: 5, initialStars: 0 },
        { attrs: {}, slots: {}, emit: () => {}, expose: () => {} },
      );
      expect(typeof instance).toBe('function');
      const vnode = (instance as () => any)();
      expect(vnode).toBeDefined();
      expect(vnode.props['data-testid']).toBe('barn-training-panel');
    });
  });

  describe('InfirmaryPotionsPanel (Enfermaria & Poções do Sertão)', () => {
    it('valida especificações de leitos e tempos de descanso da enfermaria', () => {
      expect(getInfirmaryBedCapacity(1)).toBe(2);
      expect(getInfirmaryBedCapacity(6)).toBe(4);
      expect(getInfirmaryBedCapacity(12)).toBe(6);
      expect(STRAW_BED_REST_TIME_MINUTES).toBe(30);
      expect(BASE_REST_TIME_MINUTES).toBe(60);
    });

    it('contém exatamente as 6 poções e ungüentos tradicionais', () => {
      expect(INFIRMARY_POTIONS).toHaveLength(6);
      const potionNames = INFIRMARY_POTIONS.map((p) => p.name);
      expect(potionNames).toContain('Ungüento de Arnica');
      expect(potionNames).toContain('Chá de Erva-Cidreira');
      expect(potionNames).toContain('Garrafada do Sertão');
      expect(potionNames).toContain('Óleo de Pequi');
      expect(potionNames).toContain('Rapadura Energética');
      expect(potionNames).toContain('Elixir da Serra');
    });

    it('renderiza o painel da enfermaria e lista de poções', async () => {
      const html = await renderToString(
        h(InfirmaryPotionsPanel, {
          initialSedeLevel: 1,
          initialVigor: 40,
          maxVigor: 100,
        }),
      );

      expect(html).toContain('data-testid="infirmary-potions-panel"');
      expect(html).toContain('Enfermaria Rural &amp; Botica do Sertão');
      expect(html).toContain('1/2 Leitos ocupados');
      expect(html).toContain('30 min (Cama de Palha de Milho Acelerada)');
      expect(html).toContain('btn-apply-arnica');
      expect(html).toContain('btn-apply-garrafada');
      expect(html).toContain('Ungüento de Arnica');
      expect(html).toContain('Garrafada do Sertão');
    });

    it('executa setup do InfirmaryPotionsPanel e monta vnode', () => {
      const renderFn = InfirmaryPotionsPanel.setup?.(
        { initialSedeLevel: 6, initialVigor: 50, maxVigor: 100 },
        { attrs: {}, slots: {}, emit: () => {}, expose: () => {} },
      );
      expect(typeof renderFn).toBe('function');
      const vnode = (renderFn as () => any)();
      expect(vnode.props['data-testid']).toBe('infirmary-potions-panel');
    });
  });

  describe('Integração em FarmTabView', () => {
    it('renderiza FarmTabView contendo Celeiro, Treino e Enfermaria', async () => {
      const runtime = createWebRuntime();
      const html = await renderToString(
        h(FarmTabView, {
          runtime,
          onAddMilho: () => {},
          onUpgradeSede: () => {},
        }),
      );

      expect(html).toContain('data-testid="tab-content-fazenda"');
      expect(html).toContain('data-testid="barn-training-panel"');
      expect(html).toContain('data-testid="infirmary-potions-panel"');
      expect(html).toContain('data-testid="pvp-raid-panel"');
    });
  });
});
