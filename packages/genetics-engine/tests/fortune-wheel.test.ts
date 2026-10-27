import { describe, expect, it } from 'vitest';
import {
  BAD_LUCK_PROTECTION_THRESHOLD,
  FREE_SPIN_COOLDOWN_MS,
  PAID_SPIN_FEATHER_COST,
  PAID_SPIN_TICKET_COST,
  TOTAL_WHEEL_WEIGHT,
  canClaimDailyFreeSpin,
  getFreeSpinRemainingCooldownMs,
  getSpinCost,
  getWheelSliceById,
  getWheelSlices,
  spinFortuneWheel,
} from '../src/index.js';

describe('Fortune Wheel Engine (Roda da Fortuna de Sao Joao)', () => {
  it('validates exact sum of weights equals 1,000 and 8 slices configuration', () => {
    const slices = getWheelSlices();
    expect(slices).toHaveLength(8);

    const totalWeight = slices.reduce((acc, s) => acc + s.weight, 0);
    expect(totalWeight).toBe(1000);
    expect(TOTAL_WHEEL_WEIGHT).toBe(1000);

    const expectedWeights = [10, 40, 80, 150, 200, 180, 140, 200];
    const expectedProbabilities = [0.01, 0.04, 0.08, 0.15, 0.2, 0.18, 0.14, 0.2];

    slices.forEach((slice, idx) => {
      expect(slice.id).toBe(idx + 1);
      expect(slice.weight).toBe(expectedWeights[idx]);
      expect(slice.probability).toBeCloseTo(expectedProbabilities[idx]!, 5);
      expect(slice.weight / TOTAL_WHEEL_WEIGHT).toBeCloseTo(slice.probability, 5);
    });

    expect(slices[0]!.name).toBe('Galo Destaque Sazonal');
    expect(slices[0]!.isGrandPrize).toBe(true);
    expect(slices[1]!.name).toBe('500 Penas Douradas');
    expect(slices[1]!.isGrandPrize).toBe(true);
    expect(slices[2]!.isGrandPrize).toBe(false);
  });

  it('correctly maps seed rolls to respective slices across boundaries', () => {
    expect(spinFortuneWheel(0.005, 0).slice.id).toBe(1);
    expect(spinFortuneWheel(0.02, 0).slice.id).toBe(2);
    expect(spinFortuneWheel(0.06, 0).slice.id).toBe(3);
    expect(spinFortuneWheel(0.2, 0).slice.id).toBe(4);
    expect(spinFortuneWheel(0.35, 0).slice.id).toBe(5);
    expect(spinFortuneWheel(0.55, 0).slice.id).toBe(6);
    expect(spinFortuneWheel(0.7, 0).slice.id).toBe(7);
    expect(spinFortuneWheel(0.9, 0).slice.id).toBe(8);

    expect(spinFortuneWheel(5, 0).slice.id).toBe(1);
    expect(spinFortuneWheel(45, 0).slice.id).toBe(2);
    expect(spinFortuneWheel(995, 0).slice.id).toBe(8);
  });

  it('increments bad luck counter on non-grand prize spins and resets on natural grand prize', () => {
    const nonGrandRoll = 0.5;
    let currentCounter = 0;

    for (let spin = 1; spin <= 5; spin++) {
      const res = spinFortuneWheel(nonGrandRoll, currentCounter);
      expect(res.badLuckProtectionTriggered).toBe(false);
      expect(res.isGrandPrize).toBe(false);
      expect(res.badLuckCounter).toBe(spin);
      currentCounter = res.badLuckCounter;
    }

    const grandRes1 = spinFortuneWheel(0.005, currentCounter);
    expect(grandRes1.slice.id).toBe(1);
    expect(grandRes1.isGrandPrize).toBe(true);
    expect(grandRes1.badLuckProtectionTriggered).toBe(false);
    expect(grandRes1.badLuckCounter).toBe(0);

    const resAfter1 = spinFortuneWheel(nonGrandRoll, 0);
    expect(resAfter1.badLuckCounter).toBe(1);
    const grandRes2 = spinFortuneWheel(0.02, resAfter1.badLuckCounter);
    expect(grandRes2.slice.id).toBe(2);
    expect(grandRes2.isGrandPrize).toBe(true);
    expect(grandRes2.badLuckCounter).toBe(0);
  });

  it('triggers bad luck protection exactly on the 20th spin without grand prize', () => {
    let counter = 0;
    const nonGrandRoll = 0.9;

    for (let spin = 1; spin <= 19; spin++) {
      const res = spinFortuneWheel(nonGrandRoll, counter);
      expect(res.badLuckProtectionTriggered).toBe(false);
      expect(res.badLuckCounter).toBe(spin);
      counter = res.badLuckCounter;
    }
    expect(counter).toBe(19);

    const spin20 = spinFortuneWheel(nonGrandRoll, counter, false);
    expect(spin20.badLuckProtectionTriggered).toBe(true);
    expect(spin20.slice.id).toBe(1);
    expect(spin20.slice.name).toBe('Galo Destaque Sazonal');
    expect(spin20.isGrandPrize).toBe(true);
    expect(spin20.badLuckCounter).toBe(0);
  });

  it('awards Slice 2 on 20th spin if featured rooster is already owned', () => {
    const spin20 = spinFortuneWheel(0.9, 19, { hasFeaturedRooster: true });
    expect(spin20.badLuckProtectionTriggered).toBe(true);
    expect(spin20.slice.id).toBe(2);
    expect(spin20.slice.name).toBe('500 Penas Douradas');
    expect(spin20.isGrandPrize).toBe(true);
    expect(spin20.badLuckCounter).toBe(0);

    const spin20Bool = spinFortuneWheel(0.9, 19, true);
    expect(spin20Bool.slice.id).toBe(2);
    expect(spin20Bool.badLuckCounter).toBe(0);
  });

  it('validates free daily spin cooldown and paid spin costs', () => {
    const baseTime = 1000000000;
    expect(canClaimDailyFreeSpin(baseTime, baseTime + FREE_SPIN_COOLDOWN_MS)).toBe(true);
    expect(canClaimDailyFreeSpin(baseTime, baseTime + FREE_SPIN_COOLDOWN_MS - 1000)).toBe(false);
    expect(getFreeSpinRemainingCooldownMs(baseTime, baseTime + 1000)).toBe(FREE_SPIN_COOLDOWN_MS - 1000);
    expect(getFreeSpinRemainingCooldownMs(baseTime, baseTime + FREE_SPIN_COOLDOWN_MS + 5000)).toBe(0);

    expect(getSpinCost('free')).toEqual({ type: 'free', cost: 0 });
    expect(getSpinCost('feathers')).toEqual({ type: 'feathers', cost: PAID_SPIN_FEATHER_COST });
    expect(getSpinCost('ticket')).toEqual({ type: 'ticket', cost: PAID_SPIN_TICKET_COST });
    expect(PAID_SPIN_FEATHER_COST).toBe(50);
    expect(PAID_SPIN_TICKET_COST).toBe(1);
    expect(BAD_LUCK_PROTECTION_THRESHOLD).toBe(20);
    expect(getWheelSliceById(1).id).toBe(1);
    expect(() => getWheelSliceById(99 as any)).toThrow();
  });
});
