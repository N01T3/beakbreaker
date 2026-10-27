import { describe, expect, it } from 'vitest';
import {
  ASTRAL_STAR_CONFIG,
  MAX_STAR_LEVEL,
  TOTAL_ASTRAL_ESSENCES,
  TOTAL_ASTRAL_ORBS,
  canAwakenStar,
  getNgCapBonus,
  getStarStatBonusPercent,
  getStarUpgradeCost,
  getStatMultiplier,
  getTotalOrbsAndEssencesToStar,
  getUnlockedPassives,
  getVigorAndForceMultiplier,
} from '../src/index.js';

describe('Astral Awakening Calculator (Estrelas Vermelhas 6★-10★)', () => {
  it('validates the complete 11,200 orbs and 15 astral essences curve', () => {
    expect(TOTAL_ASTRAL_ORBS).toBe(11200);
    expect(TOTAL_ASTRAL_ESSENCES).toBe(15);
    expect(MAX_STAR_LEVEL).toBe(10);

    const expectedOrbs = [120, 200, 320, 560, 800, 1000, 1300, 1700, 2200, 3000];
    const expectedCumulativeOrbs = [120, 320, 640, 1200, 2000, 3000, 4300, 6000, 8200, 11200];
    const expectedEssences = [0, 0, 0, 0, 0, 1, 2, 3, 4, 5];
    const expectedCumulativeEssences = [0, 0, 0, 0, 0, 1, 3, 6, 10, 15];

    ASTRAL_STAR_CONFIG.forEach((cfg, idx) => {
      expect(cfg.targetStar).toBe(idx + 1);
      expect(cfg.orbs).toBe(expectedOrbs[idx]);
      expect(cfg.cumulativeOrbs).toBe(expectedCumulativeOrbs[idx]);
      expect(cfg.astralEssences).toBe(expectedEssences[idx]);
      expect(cfg.cumulativeEssences).toBe(expectedCumulativeEssences[idx]);
    });
  });

  it('checks individual star costs and passive unlock milestones', () => {
    const star1 = getStarUpgradeCost(1);
    expect(star1.category).toBe('Amarela');
    expect(star1.orbs).toBe(120);
    expect(star1.astralEssences).toBe(0);
    expect(star1.unlockedPassive).toBeUndefined();

    const star5 = getStarUpgradeCost(5);
    expect(star5.category).toBe('Amarela');
    expect(star5.orbs).toBe(800);
    expect(star5.cumulativeOrbs).toBe(2000);
    expect(star5.astralEssences).toBe(0);

    const star6 = getStarUpgradeCost(6);
    expect(star6.category).toBe('DespertarAstral');
    expect(star6.orbs).toBe(1000);
    expect(star6.astralEssences).toBe(1);
    expect(star6.cumulativeOrbs).toBe(3000);
    expect(star6.cumulativeEssences).toBe(1);
    expect(star6.unlockedPassive).toBe('1ª Passiva Astral');

    const star10 = getStarUpgradeCost(10);
    expect(star10.category).toBe('DespertarAstral');
    expect(star10.orbs).toBe(3000);
    expect(star10.astralEssences).toBe(5);
    expect(star10.cumulativeOrbs).toBe(11200);
    expect(star10.cumulativeEssences).toBe(15);
    expect(star10.unlockedPassive).toBe('2ª Passiva Astral (Aura Suprema)');
  });

  it('calculates cumulative totals up to any star level', () => {
    expect(getTotalOrbsAndEssencesToStar(0)).toEqual({
      targetStar: 0, totalOrbs: 0, totalEssences: 0, orbs: 0, essences: 0,
    });
    expect(getTotalOrbsAndEssencesToStar(5)).toEqual({
      targetStar: 5, totalOrbs: 2000, totalEssences: 0, orbs: 2000, essences: 0,
    });
    expect(getTotalOrbsAndEssencesToStar(6)).toEqual({
      targetStar: 6, totalOrbs: 3000, totalEssences: 1, orbs: 3000, essences: 1,
    });
    expect(getTotalOrbsAndEssencesToStar(10)).toEqual({
      targetStar: 10, totalOrbs: 11200, totalEssences: 15, orbs: 11200, essences: 15,
    });

    expect(() => getTotalOrbsAndEssencesToStar(-1)).toThrow();
    expect(() => getTotalOrbsAndEssencesToStar(11)).toThrow();
  });

  it('calculates Vigor, Força and NG cap bonuses', () => {
    expect(getStarStatBonusPercent(0)).toBe(0);
    expect(getStarStatBonusPercent(1)).toBe(15);
    expect(getStarStatBonusPercent(5)).toBe(75);
    expect(getStarStatBonusPercent(6)).toBe(100);
    expect(getStarStatBonusPercent(7)).toBe(125);
    expect(getStarStatBonusPercent(8)).toBe(150);
    expect(getStarStatBonusPercent(9)).toBe(175);
    expect(getStarStatBonusPercent(10)).toBe(200);

    expect(getStatMultiplier(0)).toBe(1.0);
    expect(getStatMultiplier(1)).toBe(1.15);
    expect(getStatMultiplier(5)).toBe(1.75);
    expect(getStatMultiplier(6)).toBe(2.0);
    expect(getStatMultiplier(10)).toBe(3.0);
    expect(getVigorAndForceMultiplier(10)).toBe(3.0);

    expect(getNgCapBonus(0)).toBe(0);
    expect(getNgCapBonus(5)).toBe(0);
    expect(getNgCapBonus(6)).toBe(2);
    expect(getNgCapBonus(7)).toBe(4);
    expect(getNgCapBonus(8)).toBe(6);
    expect(getNgCapBonus(9)).toBe(8);
    expect(getNgCapBonus(10)).toBe(10);

    expect(getUnlockedPassives(5)).toEqual([]);
    expect(getUnlockedPassives(6)).toEqual(['1ª Passiva Astral']);
    expect(getUnlockedPassives(9)).toEqual(['1ª Passiva Astral']);
    expect(getUnlockedPassives(10)).toEqual(['1ª Passiva Astral', '2ª Passiva Astral (Aura Suprema)']);
  });

  it('validates canAwakenStar requirements for standard and astral awakenings', () => {
    expect(canAwakenStar(0, 120, 0)).toBe(true);
    expect(canAwakenStar(0, 119, 0)).toBe(false);

    expect(canAwakenStar(5, 1000, 1)).toBe(true);
    expect(canAwakenStar(5, 999, 1)).toBe(false);
    expect(canAwakenStar(5, 1000, 0)).toBe(false);

    expect(canAwakenStar(9, 3000, 5)).toBe(true);
    expect(canAwakenStar(9, 3000, 4)).toBe(false);
    expect(canAwakenStar(9, 2999, 5)).toBe(false);

    expect(canAwakenStar(10, 5000, 10)).toBe(false);
    expect(canAwakenStar(-1, 1000, 5)).toBe(false);
  });

  it('validates canAwakenStar with Joker Orbs and Happy Hour', () => {
    // 5★ -> 6★ requires 1000 orbs. Normal days: >= 80% species (800) and <= 20% joker (200)
    expect(canAwakenStar(5, { speciesOrbs: 800, jokerOrbs: 200 }, 1, false)).toBe(true);
    expect(canAwakenStar(5, { speciesOrbs: 799, jokerOrbs: 201 }, 1, false)).toBe(false);
    expect(canAwakenStar(5, { speciesOrbs: 700, jokerOrbs: 500 }, 1, false)).toBe(false);

    // Happy hour permits 100% joker orbs
    expect(canAwakenStar(5, { speciesOrbs: 0, jokerOrbs: 1000 }, 1, true)).toBe(true);
    expect(canAwakenStar(5, { speciesOrbs: 500, jokerOrbs: 500 }, 1, true)).toBe(true);
    expect(canAwakenStar(5, { speciesOrbs: 0, jokerOrbs: 999 }, 1, true)).toBe(false);

    // Supports passing joker orbs via parameters
    expect(canAwakenStar(5, 800, 1, false, 200)).toBe(true);
    expect(canAwakenStar(5, 799, 1, false, 201)).toBe(false);
    expect(canAwakenStar(5, 0, 1, true, 1000)).toBe(true);
  });
});
