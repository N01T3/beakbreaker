export const TOTAL_WHEEL_WEIGHT = 1000;
export const BAD_LUCK_PROTECTION_THRESHOLD = 20;
export const FREE_SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const PAID_SPIN_FEATHER_COST = 50;
export const PAID_SPIN_TICKET_COST = 1;

export type WheelSliceId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type WheelRewardType =
  | 'rooster_featured'
  | 'golden_feathers'
  | 'wild_orbs'
  | 'corn'
  | 'energy_rapadura'
  | 'ointment_arnica';

export interface WheelSlice {
  id: WheelSliceId;
  name: string;
  weight: number;
  probability: number;
  rewardType: WheelRewardType;
  amount: number;
  isGrandPrize: boolean;
}

export const WHEEL_SLICES: readonly WheelSlice[] = [
  { id: 1, name: 'Galo Destaque Sazonal', weight: 10, probability: 0.01, rewardType: 'rooster_featured', amount: 1, isGrandPrize: true },
  { id: 2, name: '500 Penas Douradas', weight: 40, probability: 0.04, rewardType: 'golden_feathers', amount: 500, isGrandPrize: true },
  { id: 3, name: '100 Orbes Curinga', weight: 80, probability: 0.08, rewardType: 'wild_orbs', amount: 100, isGrandPrize: false },
  { id: 4, name: '100.000 de Milho', weight: 150, probability: 0.15, rewardType: 'corn', amount: 100000, isGrandPrize: false },
  { id: 5, name: '30 de Fôlego (Rapadura)', weight: 200, probability: 0.2, rewardType: 'energy_rapadura', amount: 30, isGrandPrize: false },
  { id: 6, name: '50 Penas Douradas', weight: 180, probability: 0.18, rewardType: 'golden_feathers', amount: 50, isGrandPrize: false },
  { id: 7, name: '30 Orbes Curinga', weight: 140, probability: 0.14, rewardType: 'wild_orbs', amount: 30, isGrandPrize: false },
  { id: 8, name: '3 Ungüentos de Arnica', weight: 200, probability: 0.2, rewardType: 'ointment_arnica', amount: 3, isGrandPrize: false },
];

export function getWheelSlices(): readonly WheelSlice[] {
  return WHEEL_SLICES;
}

export function getWheelSliceById(id: WheelSliceId): WheelSlice {
  const slice = WHEEL_SLICES.find((s) => s.id === id);
  if (!slice) throw new Error(`Fatia da roda nao encontrada para o id: ${id}`);
  return slice;
}

export interface SpinOptions {
  hasFeaturedRooster?: boolean;
}

export interface SpinResult {
  slice: WheelSlice;
  badLuckCounter: number;
  badLuckProtectionTriggered: boolean;
  isGrandPrize: boolean;
  rawRoll: number;
}

export function spinFortuneWheel(
  seedRoll: number,
  badLuckCounter = 0,
  optionsOrHasFeatured: boolean | SpinOptions = false
): SpinResult {
  const hasFeaturedRooster =
    typeof optionsOrHasFeatured === 'boolean'
      ? optionsOrHasFeatured
      : Boolean(optionsOrHasFeatured?.hasFeaturedRooster);

  const safeCounter = Math.max(0, Math.floor(badLuckCounter));
  const nextCounter = safeCounter + 1;

  if (nextCounter >= BAD_LUCK_PROTECTION_THRESHOLD) {
    const slice = hasFeaturedRooster ? getWheelSliceById(2) : getWheelSliceById(1);
    return {
      slice,
      badLuckCounter: 0,
      badLuckProtectionTriggered: true,
      isGrandPrize: true,
      rawRoll: seedRoll,
    };
  }

  let normalizedValue = seedRoll;
  if (normalizedValue >= 0 && normalizedValue <= 1) {
    normalizedValue = Math.min(999.999, normalizedValue * TOTAL_WHEEL_WEIGHT);
  } else {
    normalizedValue = Math.abs(normalizedValue) % TOTAL_WHEEL_WEIGHT;
  }

  let accumulated = 0;
  let selectedSlice = WHEEL_SLICES[WHEEL_SLICES.length - 1]!;
  for (const s of WHEEL_SLICES) {
    accumulated += s.weight;
    if (normalizedValue < accumulated) {
      selectedSlice = s;
      break;
    }
  }

  const isGrandPrize = selectedSlice.isGrandPrize;
  const resultingCounter = isGrandPrize ? 0 : nextCounter;

  return {
    slice: selectedSlice,
    badLuckCounter: resultingCounter,
    badLuckProtectionTriggered: false,
    isGrandPrize,
    rawRoll: seedRoll,
  };
}

export function canClaimDailyFreeSpin(
  lastSpinTimestampMs: number,
  currentTimestampMs: number = Date.now()
): boolean {
  return currentTimestampMs - lastSpinTimestampMs >= FREE_SPIN_COOLDOWN_MS;
}

export function getFreeSpinRemainingCooldownMs(
  lastSpinTimestampMs: number,
  currentTimestampMs: number = Date.now()
): number {
  const elapsed = currentTimestampMs - lastSpinTimestampMs;
  return Math.max(0, FREE_SPIN_COOLDOWN_MS - elapsed);
}

export type SpinCostType = 'free' | 'feathers' | 'ticket';
export interface SpinCost {
  type: SpinCostType;
  cost: number;
}

export function getSpinCost(type: SpinCostType): SpinCost {
  switch (type) {
    case 'free': return { type: 'free', cost: 0 };
    case 'ticket': return { type: 'ticket', cost: PAID_SPIN_TICKET_COST };
    case 'feathers': return { type: 'feathers', cost: PAID_SPIN_FEATHER_COST };
  }
}
