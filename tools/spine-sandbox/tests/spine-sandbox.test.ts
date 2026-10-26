import { describe, expect, it } from 'vitest';
import {
  runSupremo9v9StressTest,
  verifySixSlotCombinations,
} from '../src/index.js';

describe('@beakbreaker/spine-sandbox', () => {
  it('verifies all 6 modular slot combinations on rooster_master.skel', () => {
    const report = verifySixSlotCombinations();
    expect(report.totalCombinationsTested).toBe(216);
    expect(report.failedAssemblies).toBe(0);
    expect(report.allSixSlotsResolved).toBe(true);
  });

  it('passes Supremo 9v9 (18 roosters) stress test within < 25 draw calls, < 120 MB VRAM and 0 GC allocations', () => {
    const stress = runSupremo9v9StressTest();
    expect(stress.simultaneousRoosters).toBe(18);
    expect(stress.totalTicksSimulated).toBe(1800);
    expect(stress.peakDrawCalls).toBeLessThan(25);
    expect(stress.peakVramMb).toBeLessThan(120);
    expect(stress.xiloPopupGcAllocations).toBe(0);
    expect(stress.passedDrawCallBudget).toBe(true);
    expect(stress.passedVramBudget).toBe(true);
    expect(stress.passedZeroGcPopupPool).toBe(true);
  });
});
