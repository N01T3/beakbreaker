import { describe, expect, it } from 'vitest';
import {
  BARN_PROTECTION_TABLE,
  calculateAstralNgBonus,
  calculateCornPerMinute,
  calculateCornToLevelUp,
  calculateLootableCorn,
  calculateMaxNg,
  calculateMinutesToLevelUp,
  calculateTrainingProgress,
  getBarnProtectionConfig,
} from '../src/index.js';

describe('Training Center & Barn Protection Suite', () => {
  describe('Sede Cap (Trava da Sede) & Astral Bonus', () => {
    it('calculates base Sede cap (Sede * 5) for levels 1 to 12 without astral stars', () => {
      const expectedCaps = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
      for (let sede = 1; sede <= 12; sede++) {
        expect(calculateMaxNg(sede)).toBe(expectedCaps[sede - 1]);
        expect(calculateMaxNg(sede, 0)).toBe(expectedCaps[sede - 1]);
        expect(calculateMaxNg(sede, 5)).toBe(expectedCaps[sede - 1]);
      }
    });

    it('adds +2 per astral star (6★ to 10★) up to +10 NG bonus', () => {
      [5, 6, 7, 8, 9, 10].forEach((star, idx) => {
        expect(calculateAstralNgBonus(star)).toBe(idx === 0 ? 0 : idx * 2);
      });
      [62, 64, 66, 68, 70].forEach((expected, i) => {
        expect(calculateMaxNg(12, 6 + i)).toBe(expected);
      });
    });

    it('throws error for invalid Sede levels', () => {
      expect(() => calculateMaxNg(0)).toThrow(/Invalid Sede level/);
      expect(() => calculateMaxNg(13)).toThrow(/Invalid Sede level/);
      expect(() => calculateMaxNg(2.5)).toThrow(/Invalid Sede level/);
    });
  });

  describe('Passive Training Progress Calculator', () => {
    it('calculates corn per minute and minutes to level up formulas correctly', () => {
      expect(calculateCornPerMinute(10)).toBe(100);
      expect(calculateCornPerMinute(25)).toBe(250);
      expect(calculateMinutesToLevelUp(10)).toBe(120);
      expect(calculateMinutesToLevelUp(25)).toBe(300);
      expect(calculateCornToLevelUp(10)).toBe(12_000);
    });

    it('progresses partially within current level when time is limited', () => {
      const res = calculateTrainingProgress({
        currentNg: 10, sedeLevel: 5, startTimeMs: 1_000_000,
        nowMs: 1_000_000 + 45 * 60_000, availableCorn: 50_000,
      });
      expect(res.finalNg).toBe(10);
      expect(res.levelsGained).toBe(0);
      expect(res.totalMinutesTrained).toBe(45);
      expect(res.cornConsumed).toBe(4_500);
      expect(res.remainingCorn).toBe(45_500);
      expect(res.currentProgressMinutes).toBe(45);
      expect(res.stoppedReason).toBe('OUT_OF_TIME');
      expect(res.isCapped).toBe(false);
    });

    it('levels up multiple times and honors Trava da Sede', () => {
      const res = calculateTrainingProgress({
        currentNg: 8, sedeLevel: 2, // Max NG = 10
        startTimeMs: 0, nowMs: 1_000 * 60_000, availableCorn: 100_000,
      });
      // NG 8: 96 min @ 80 = 7,680 -> NG 9; NG 9: 108 min @ 90 = 9,720 -> NG 10 (cap)
      expect(res.finalNg).toBe(10);
      expect(res.levelsGained).toBe(2);
      expect(res.maxNg).toBe(10);
      expect(res.totalMinutesTrained).toBe(204);
      expect(res.cornConsumed).toBe(17_400);
      expect(res.isCapped).toBe(true);
      expect(res.stoppedReason).toBe('COMPLETED_CAP');
    });

    it('halts when corn runs out before time expires', () => {
      const res = calculateTrainingProgress({
        currentNg: 15, sedeLevel: 5, startTimeMs: 0,
        nowMs: 180 * 60_000, availableCorn: 4_500, // NG 15 = 150/min -> 30 min affordable
      });
      expect(res.levelsGained).toBe(0);
      expect(res.totalMinutesTrained).toBe(30);
      expect(res.cornConsumed).toBe(4_500);
      expect(res.remainingCorn).toBe(0);
      expect(res.currentProgressMinutes).toBe(30);
      expect(res.stoppedReason).toBe('OUT_OF_CORN');
    });

    it('immediately returns if already at or above Sede cap', () => {
      const res = calculateTrainingProgress({
        currentNg: 15, sedeLevel: 3, startTimeMs: 0,
        nowMs: 60 * 60_000, availableCorn: 10_000,
      });
      expect(res.finalNg).toBe(15);
      expect(res.cornConsumed).toBe(0);
      expect(res.isCapped).toBe(true);
      expect(res.stoppedReason).toBe('COMPLETED_CAP');
    });
  });

  describe('Barn Storage & Loot Protection (12 Sede Levels)', () => {
    it('verifies all 12 levels in BARN_PROTECTION_TABLE match GDD specifications', () => {
      const expected = [
        { sedeLevel: 1, protectedCorn: 2_000, maxCapacity: 10_000 },
        { sedeLevel: 2, protectedCorn: 5_000, maxCapacity: 25_000 },
        { sedeLevel: 3, protectedCorn: 15_000, maxCapacity: 60_000 },
        { sedeLevel: 4, protectedCorn: 40_000, maxCapacity: 150_000 },
        { sedeLevel: 5, protectedCorn: 100_000, maxCapacity: 400_000 },
        { sedeLevel: 6, protectedCorn: 250_000, maxCapacity: 1_000_000 },
        { sedeLevel: 7, protectedCorn: 500_000, maxCapacity: 2_200_000 },
        { sedeLevel: 8, protectedCorn: 1_000_000, maxCapacity: 4_500_000 },
        { sedeLevel: 9, protectedCorn: 1_800_000, maxCapacity: 8_000_000 },
        { sedeLevel: 10, protectedCorn: 2_800_000, maxCapacity: 14_000_000 },
        { sedeLevel: 11, protectedCorn: 3_800_000, maxCapacity: 22_000_000 },
        { sedeLevel: 12, protectedCorn: 5_000_000, maxCapacity: 35_000_000 },
      ];

      expect(BARN_PROTECTION_TABLE).toHaveLength(12);
      for (const item of expected) {
        expect(getBarnProtectionConfig(item.sedeLevel)).toEqual(item);
      }
    });

    it('calculates lootable corn and 20% max stealable corn correctly', () => {
      // Below protected threshold
      expect(calculateLootableCorn(1_500, 1)).toEqual({
        protectedCorn: 2_000, lootableCorn: 0, maxStealableCorn20Pct: 0,
      });

      // Sede 1 full barn (10,000): 8,000 lootable -> 1,600 stealable (20%)
      expect(calculateLootableCorn(10_000, 1)).toEqual({
        protectedCorn: 2_000, lootableCorn: 8_000, maxStealableCorn20Pct: 1_600,
      });

      // Sede 12 full barn (35,000,000): 30,000,000 lootable -> 6,000,000 stealable (20%)
      expect(calculateLootableCorn(35_000_000, 12)).toEqual({
        protectedCorn: 5_000_000, lootableCorn: 30_000_000, maxStealableCorn20Pct: 6_000_000,
      });

      // Clamp to max capacity option
      expect(calculateLootableCorn(20_000, 1, true)).toEqual({
        protectedCorn: 2_000, lootableCorn: 8_000, maxStealableCorn20Pct: 1_600,
      });
    });

    it('throws error when querying invalid Sede level', () => {
      expect(() => getBarnProtectionConfig(0)).toThrow(/Invalid Sede level/);
      expect(() => getBarnProtectionConfig(13)).toThrow(/Invalid Sede level/);
    });
  });
});
