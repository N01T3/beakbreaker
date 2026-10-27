export interface BarnProtectionConfig {
  readonly sedeLevel: number;
  readonly protectedCorn: number;
  readonly maxCapacity: number;
}

export const BARN_PROTECTION_TABLE: readonly BarnProtectionConfig[] = [
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
] as const;

export function getBarnProtectionConfig(sedeLevel: number): BarnProtectionConfig {
  const config = BARN_PROTECTION_TABLE.find((c) => c.sedeLevel === sedeLevel);
  if (!config) {
    throw new Error(
      `Invalid Sede level: ${sedeLevel}. Must be an integer between 1 and 12.`
    );
  }
  return config;
}

export interface LootableCornResult {
  protectedCorn: number;
  lootableCorn: number;
  maxStealableCorn20Pct: number;
}

export function calculateLootableCorn(
  storedCorn: number,
  sedeLevel: number,
  clampToCapacity = false
): LootableCornResult {
  const config = getBarnProtectionConfig(sedeLevel);
  const normalizedStored = Math.max(0, Math.floor(storedCorn));
  const effectiveStored = clampToCapacity
    ? Math.min(normalizedStored, config.maxCapacity)
    : normalizedStored;

  const lootableCorn = Math.max(0, effectiveStored - config.protectedCorn);
  const maxStealableCorn20Pct = Math.floor(lootableCorn * 0.2);

  return {
    protectedCorn: config.protectedCorn,
    lootableCorn,
    maxStealableCorn20Pct,
  };
}
