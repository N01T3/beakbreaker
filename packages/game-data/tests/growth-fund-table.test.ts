import { describe, expect, it } from 'vitest';
import {
  GROWTH_FUND_PRICE_BRL,
  GROWTH_FUND_TIERS,
  GROWTH_FUND_TOTALS,
  getGrowthFundTier,
} from '../src/growth-fund-table.js';

describe('Growth Fund Table Specification (GDD v5.0)', () => {
  it('contém exatamente 12 níveis de Sede (1 a 12)', () => {
    expect(GROWTH_FUND_TIERS).toHaveLength(12);
    for (let i = 0; i < 12; i++) {
      expect(GROWTH_FUND_TIERS[i].sedeLevel).toBe(i + 1);
    }
  });

  it('preço do passe Coronel / Premium é R$ 39,90', () => {
    expect(GROWTH_FUND_PRICE_BRL).toBe(39.9);
  });

  it('faixa gratuita acumula exatamente 500k de Milho e 1.500 Penas Douradas', () => {
    const totalMilho = GROWTH_FUND_TIERS.reduce((acc, t) => acc + t.freeReward.milho, 0);
    const totalPenas = GROWTH_FUND_TIERS.reduce((acc, t) => acc + t.freeReward.goldenFeathers, 0);

    expect(totalMilho).toBe(500_000);
    expect(totalPenas).toBe(1_500);
    expect(GROWTH_FUND_TOTALS.freeMilho).toBe(500_000);
    expect(GROWTH_FUND_TOTALS.freeGoldenFeathers).toBe(1_500);

    for (const tier of GROWTH_FUND_TIERS) {
      expect(tier.freeReward.milho).toBeGreaterThanOrEqual(10_000);
      expect(tier.freeReward.milho).toBeLessThanOrEqual(100_000);
      expect(tier.freeReward.goldenFeathers).toBeGreaterThanOrEqual(50);
      expect(tier.freeReward.goldenFeathers).toBeLessThanOrEqual(250);
    }
  });

  it('faixa Coronel acumula 6.500 Penas Douradas, 500 Coroas e Orbes Curinga', () => {
    const totalPenas = GROWTH_FUND_TIERS.reduce((acc, t) => acc + t.premiumReward.goldenFeathers, 0);
    const totalCoroas = GROWTH_FUND_TIERS.reduce((acc, t) => acc + t.premiumReward.coroas, 0);
    const totalOrbes = GROWTH_FUND_TIERS.reduce((acc, t) => acc + t.premiumReward.wildOrbs, 0);

    expect(totalPenas).toBe(6_500);
    expect(totalCoroas).toBe(500);
    expect(totalOrbes).toBeGreaterThan(0);
    expect(GROWTH_FUND_TOTALS.premiumGoldenFeathers).toBe(6_500);
    expect(GROWTH_FUND_TOTALS.premiumCoroas).toBe(500);
  });

  it('função getGrowthFundTier busca nível de Sede corretamente', () => {
    const tier5 = getGrowthFundTier(5);
    expect(tier5).toBeDefined();
    expect(tier5?.sedeLevel).toBe(5);
    expect(tier5?.freeReward.goldenFeathers).toBe(100);

    const invalid = getGrowthFundTier(99);
    expect(invalid).toBeUndefined();
  });
});
