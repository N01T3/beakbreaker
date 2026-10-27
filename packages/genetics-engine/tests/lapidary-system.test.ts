import { describe, expect, it } from 'vitest';
import {
  LAPIDARY_RECIPES,
  calculateLapidaryProgress,
  claimLapidaryReward,
  getUnlockedSlots,
  isLapidaryUnlocked,
  isSlotUnlocked,
  startLapidaryJob,
} from '../src/LapidarySystem.js';

describe('Lapidary System Suite (Sertão Ancestral)', () => {
  describe('Slot unlocking & Sede requirements', () => {
    it('is locked below Sede 8 (NC 22)', () => {
      expect(isLapidaryUnlocked(7)).toBe(false);
      expect(getUnlockedSlots(7)).toEqual([]);
      expect(() => startLapidaryJob({ slotId: 1, type: 'lapidacao_rapida', sedeLevel: 7 })).toThrow(/Lapidary locked/);
    });

    it('unlocks Slot 1 at Sede 8, Slot 2 at Sede 10, Slot 3 at Sede 12', () => {
      expect(getUnlockedSlots(8)).toEqual([1]);
      expect(getUnlockedSlots(9)).toEqual([1]);
      expect(isSlotUnlocked(1, 8)).toBe(true);
      expect(isSlotUnlocked(2, 8)).toBe(false);

      expect(getUnlockedSlots(10)).toEqual([1, 2]);
      expect(isSlotUnlocked(2, 10)).toBe(true);
      expect(isSlotUnlocked(3, 10)).toBe(false);

      expect(getUnlockedSlots(12)).toEqual([1, 2, 3]);
      expect(isSlotUnlocked(3, 12)).toBe(true);
    });

    it('rejects jobs in locked or already occupied slots', () => {
      expect(() => startLapidaryJob({ slotId: 2, type: 'lapidacao_rapida', sedeLevel: 8 })).toThrow(/Slot 2 is locked/);
      const activeJob = { slotId: 1, type: 'lapidacao_rapida' as const, startTimeMs: 1000, durationMs: 14_400_000, cornCost: 50_000 };
      expect(() => startLapidaryJob({ slotId: 1, type: 'lapidacao_rapida', sedeLevel: 8, activeJobs: [activeJob] })).toThrow(/Slot 1 is already occupied/);
    });
  });

  describe('Lapidary recipes and corn economy', () => {
    it('configures the 3 elemental gem lapidation types correctly', () => {
      expect(LAPIDARY_RECIPES.lapidacao_rapida).toMatchObject({
        durationMinutes: 240,
        cornCost: 50_000,
        guaranteedReward: 'joia_elemental_rara',
        astralEssenceChance: 0.1,
      });
      expect(LAPIDARY_RECIPES.lapidacao_profunda).toMatchObject({
        durationMinutes: 480,
        cornCost: 120_000,
        guaranteedReward: 'joia_elemental_epica',
        astralEssenceChance: 0.35,
      });
      expect(LAPIDARY_RECIPES.lapidacao_ancestral).toMatchObject({
        durationMinutes: 1440,
        cornCost: 300_000,
        guaranteedReward: 'joia_primordial_lendaria',
        astralEssenceChance: 1.0,
      });
    });

    it('validates and deducts corn correctly', () => {
      expect(() => startLapidaryJob({ slotId: 1, type: 'lapidacao_rapida', sedeLevel: 8, availableCorn: 40_000 })).toThrow(/Insufficient corn/);
      const result = startLapidaryJob({ slotId: 1, type: 'lapidacao_rapida', sedeLevel: 8, availableCorn: 60_000 });
      expect(result.remainingCorn).toBe(10_000);
      expect(result.job.durationMs).toBe(240 * 60 * 1000);
    });
  });

  describe('Lazy progress calculation', () => {
    it('computes elapsed time, progress percentage, and completion', () => {
      const startTime = 1_000_000;
      const job = { slotId: 1, type: 'lapidacao_rapida' as const, startTimeMs: startTime, durationMs: 14_400_000, cornCost: 50_000 };

      const p0 = calculateLapidaryProgress(job, startTime);
      expect(p0.progressPct).toBe(0);
      expect(p0.isCompleted).toBe(false);
      expect(p0.remainingMs).toBe(14_400_000);

      const pHalf = calculateLapidaryProgress(job, startTime + 7_200_000);
      expect(pHalf.progressPct).toBe(50);
      expect(pHalf.isCompleted).toBe(false);
      expect(pHalf.remainingMs).toBe(7_200_000);

      const pDone = calculateLapidaryProgress(job, startTime + 14_400_000);
      expect(pDone.progressPct).toBe(100);
      expect(pDone.isCompleted).toBe(true);
      expect(pDone.remainingMs).toBe(0);

      const pOver = calculateLapidaryProgress(job, startTime + 20_000_000);
      expect(pOver.progressPct).toBe(100);
      expect(pOver.isCompleted).toBe(true);
      expect(pOver.remainingMs).toBe(0);
    });
  });

  describe('Claiming rewards & Astral Essence probabilities', () => {
    const start = 1_000_000;
    const makeJob = (type: keyof typeof LAPIDARY_RECIPES) => ({
      slotId: 1,
      type,
      startTimeMs: start,
      durationMs: LAPIDARY_RECIPES[type].durationMs,
      cornCost: LAPIDARY_RECIPES[type].cornCost,
    });

    it('prevents claiming incomplete jobs', () => {
      const job = makeJob('lapidacao_rapida');
      expect(() => claimLapidaryReward(job, start + 1000)).toThrow(/still in progress/);
    });

    it('delivers 10% chance for rapid lapidation', () => {
      const job = makeJob('lapidacao_rapida');
      const finish = start + job.durationMs;
      const win = claimLapidaryReward(job, finish, () => 0.05);
      expect(win.guaranteedItem).toBe('joia_elemental_rara');
      expect(win.gotAstralEssence).toBe(true);
      expect(win.astralEssenceCount).toBe(1);

      const lose = claimLapidaryReward(job, finish, () => 0.15);
      expect(lose.gotAstralEssence).toBe(false);
      expect(lose.astralEssenceCount).toBe(0);
    });

    it('delivers 35% chance for deep lapidation', () => {
      const job = makeJob('lapidacao_profunda');
      const finish = start + job.durationMs;
      const win = claimLapidaryReward(job, finish, () => 0.30);
      expect(win.guaranteedItem).toBe('joia_elemental_epica');
      expect(win.gotAstralEssence).toBe(true);

      const lose = claimLapidaryReward(job, finish, () => 0.40);
      expect(lose.gotAstralEssence).toBe(false);
    });

    it('guarantees 100% Astral Essence for ancestral lapidation', () => {
      const job = makeJob('lapidacao_ancestral');
      const finish = start + job.durationMs;
      const reward = claimLapidaryReward(job, finish, () => 0.999);
      expect(reward.guaranteedItem).toBe('joia_primordial_lendaria');
      expect(reward.gotAstralEssence).toBe(true);
      expect(reward.astralEssenceCount).toBe(1);
    });
  });
});
