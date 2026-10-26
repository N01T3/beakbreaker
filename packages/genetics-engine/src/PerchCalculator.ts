import type { Rarity } from './NinhalCalculator.js';

export const PERCH_RARITY_BASE_RATE: Record<Rarity, number> = {
  Comum: 1.5,
  Raro: 2.2,
  Epico: 3.2,
  Lendario: 4.8,
  Mitico: 6.5,
  Heroico: 7.0,
  Primordial: 7.0,
};

export interface PerchLevelConfig {
  level: number;
  roosterSlots: number;
  cornCapacity: number;
  requiredSedeLevel: number;
}

export const PERCH_LEVEL_TABLE: readonly PerchLevelConfig[] = [
  { level: 1, roosterSlots: 2, cornCapacity: 3000, requiredSedeLevel: 1 },
  { level: 2, roosterSlots: 2, cornCapacity: 5000, requiredSedeLevel: 2 },
  { level: 3, roosterSlots: 3, cornCapacity: 8000, requiredSedeLevel: 3 },
  { level: 4, roosterSlots: 3, cornCapacity: 12000, requiredSedeLevel: 5 },
  { level: 5, roosterSlots: 4, cornCapacity: 18000, requiredSedeLevel: 6 },
  { level: 6, roosterSlots: 4, cornCapacity: 26000, requiredSedeLevel: 8 },
  { level: 7, roosterSlots: 5, cornCapacity: 36000, requiredSedeLevel: 10 },
  { level: 8, roosterSlots: 5, cornCapacity: 50000, requiredSedeLevel: 12 },
] as const;

export interface PerchBonusFlags {
  hasElementTotem?: boolean;     // +20%
  isFavorableDayNight?: boolean; // +10% (Sol de dia / Lua à noite)
  isFavorableSeason?: boolean;   // +10%
  hasFarmerCard?: boolean;       // +20%
  customMultiplier?: number;
}

export interface PerchRoosterSlot {
  roosterId: string;
  rarity: Rarity;
  ng: number;
  stars: number;
  bonusFlags?: PerchBonusFlags;
}

export function getPerchLevelConfig(level: number): PerchLevelConfig {
  const cfg = PERCH_LEVEL_TABLE.find((p) => p.level === level);
  if (!cfg) {
    throw new Error(`Invalid Perch level: ${level}. Must be 1..8`);
  }
  return cfg;
}

export function calculatePerchBonusMultiplier(flags?: PerchBonusFlags): number {
  if (!flags) return 1.0;
  if (typeof flags.customMultiplier === 'number') {
    return flags.customMultiplier;
  }
  let bonus = 1.0;
  if (flags.hasElementTotem) bonus += 0.2;
  if (flags.isFavorableDayNight) bonus += 0.1;
  if (flags.isFavorableSeason) bonus += 0.1;
  if (flags.hasFarmerCard) bonus += 0.2;
  return Number(bonus.toFixed(4));
}

export function calculateRoosterCornPerMinExact(
  rarity: Rarity,
  ng: number,
  stars: number,
  bonusMultiplier = 1.0
): number {
  const baseRar = PERCH_RARITY_BASE_RATE[rarity];
  const clampedNg = Math.max(1, ng);
  const clampedStars = Math.max(0, Math.min(10, stars));
  return baseRar * clampedNg * (1 + 0.15 * clampedStars) * bonusMultiplier;
}

export function calculateRoosterCornPerMin(
  rarity: Rarity,
  ng: number,
  stars: number,
  bonusMultiplier = 1.0
): number {
  return Math.round(
    calculateRoosterCornPerMinExact(rarity, ng, stars, bonusMultiplier)
  );
}

export interface LazyPerchEvaluationInput {
  perchLevel: number;
  roosters: readonly PerchRoosterSlot[];
  lastCollectedAtMs: number;
  nowMs: number;
}

export interface LazyPerchEvaluationResult {
  perchLevel: number;
  capacity: number;
  totalCornPerMinExact: number;
  totalCornPerMinRounded: number;
  elapsedMinutes: number;
  rawProducedCorn: number;
  collectibleCorn: number;
  isCapped: boolean;
}

export function evaluatePerchHarvestLazy(
  input: LazyPerchEvaluationInput
): LazyPerchEvaluationResult {
  const cfg = getPerchLevelConfig(input.perchLevel);
  if (input.roosters.length > cfg.roosterSlots) {
    throw new Error(
      `Perch Lv.${cfg.level} supports max ${cfg.roosterSlots} roosters`
    );
  }

  let totalCornPerMinExact = 0;
  for (const r of input.roosters) {
    const mult = calculatePerchBonusMultiplier(r.bonusFlags);
    totalCornPerMinExact += calculateRoosterCornPerMinExact(
      r.rarity,
      r.ng,
      r.stars,
      mult
    );
  }

  const elapsedMs = Math.max(0, input.nowMs - input.lastCollectedAtMs);
  const elapsedMinutes = elapsedMs / 60_000;
  const rawProducedCorn = Math.floor(totalCornPerMinExact * elapsedMinutes);
  const collectibleCorn = Math.min(cfg.cornCapacity, rawProducedCorn);

  return {
    perchLevel: cfg.level,
    capacity: cfg.cornCapacity,
    totalCornPerMinExact: Number(totalCornPerMinExact.toFixed(4)),
    totalCornPerMinRounded: Math.round(totalCornPerMinExact),
    elapsedMinutes,
    rawProducedCorn,
    collectibleCorn,
    isCapped: rawProducedCorn >= cfg.cornCapacity,
  };
}

export function calculateTorreDaFarturaGrant(
  allPerchesCornPerMinExact: number
): number {
  // Torre da Fartura: credita imediatamente 360 minutos (6h) da produção total
  return Math.floor(allPerchesCornPerMinExact * 360);
}
