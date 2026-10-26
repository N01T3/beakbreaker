import type { Rarity } from './NinhalCalculator.js';

export const SINGLE_PULL_FEATHER_COST = 160;
export const TEN_PULL_FEATHER_COST = 1600;
export const SOFT_PITY_START_PULL = 61;
export const HARD_PITY_PULL = 80;
export const FLASH_PITY_OFFER_PRICE_BRL = 34.9;
export const FLASH_PITY_OFFER_PULLS = 20;
export const FLASH_PITY_OFFER_DURATION_SEC = 7200; // 2 hours

export interface GachaPlayerState {
  pityCounter: number;
  epicPityCounter: number;
  guaranteedFeaturedNext: boolean;
  goldenFeathers: number;
}

export interface GachaBannerConfig {
  bannerId: string;
  featuredLegendaryId: string;
  standardLegendaryPool: readonly string[];
  epicPool: readonly string[];
  rarePool: readonly string[];
  commonPool: readonly string[];
}

export const DEFAULT_CHOCADEIRA_BANNER: GachaBannerConfig = {
  bannerId: 'BANNER_TROVAO_SERTAO',
  featuredLegendaryId: '#18',
  standardLegendaryPool: ['#19', '#20', '#21', '#22', '#23', '#24', '#39', '#40'],
  epicPool: ['#11', '#12', '#13', '#14', '#15', '#16', '#17', '#36', '#37'],
  rarePool: ['#5', '#6', '#7', '#8', '#9', '#10', '#33', '#34', '#35'],
  commonPool: ['#1', '#2', '#3', '#4', '#31', '#32'],
};

export interface SinglePullOutcome {
  pullNumberInPityCycle: number;
  rarity: Rarity;
  speciesId: string;
  isFeaturedLegendary: boolean;
  wonFiftyFifty: boolean | null;
  legendaryProbabilityUsed: number;
  stateAfter: GachaPlayerState;
  triggerFlashPityOffer: boolean;
}

export function getLegendaryPullProbability(pullNumber: number): number {
  const n = Math.max(1, Math.floor(pullNumber));
  if (n <= 60) {
    return 0.02;
  }
  if (n < 80) {
    return Number((0.02 + 0.05 * (n - 60)).toFixed(4));
  }
  return 1.0;
}

export function shouldTriggerFlashPityOffer(
  pityCounter: number,
  goldenFeathers: number
): boolean {
  return (
    pityCounter >= 58 &&
    pityCounter <= 65 &&
    goldenFeathers < SINGLE_PULL_FEATHER_COST
  );
}

function pickFromPool(pool: readonly string[], rng: () => number): string {
  if (pool.length === 0) return '#1';
  const idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[idx]!;
}

export function executeSinglePull(
  state: GachaPlayerState,
  banner: GachaBannerConfig = DEFAULT_CHOCADEIRA_BANNER,
  rng: () => number = Math.random,
  deductFeathers = true
): SinglePullOutcome {
  if (deductFeathers && state.goldenFeathers < SINGLE_PULL_FEATHER_COST) {
    throw new Error('Insufficient Golden Feathers for Chocadeira pull');
  }

  const nextPullNumber = state.pityCounter + 1;
  const nextEpicCount = state.epicPityCounter + 1;
  const pLeg = getLegendaryPullProbability(nextPullNumber);
  const roll = rng();

  const remainingFeathers = deductFeathers
    ? state.goldenFeathers - SINGLE_PULL_FEATHER_COST
    : state.goldenFeathers;

  if (roll < pLeg) {
    let isFeatured = false;
    let wonFiftyFifty: boolean | null = null;
    if (state.guaranteedFeaturedNext) {
      isFeatured = true;
      wonFiftyFifty = null;
    } else {
      wonFiftyFifty = rng() < 0.5;
      isFeatured = wonFiftyFifty;
    }

    const speciesId = isFeatured
      ? banner.featuredLegendaryId
      : pickFromPool(banner.standardLegendaryPool, rng);

    const stateAfter: GachaPlayerState = {
      pityCounter: 0,
      epicPityCounter: 0,
      guaranteedFeaturedNext: !isFeatured,
      goldenFeathers: remainingFeathers,
    };

    return {
      pullNumberInPityCycle: nextPullNumber,
      rarity: 'Lendario',
      speciesId,
      isFeaturedLegendary: isFeatured,
      wonFiftyFifty,
      legendaryProbabilityUsed: pLeg,
      stateAfter,
      triggerFlashPityOffer: shouldTriggerFlashPityOffer(
        stateAfter.pityCounter,
        stateAfter.goldenFeathers
      ),
    };
  }

  let rarity: Rarity;
  let speciesId: string;
  let epicCounterAfter = nextEpicCount;

  if (nextEpicCount >= 10 || roll < pLeg + 0.12) {
    rarity = 'Epico';
    speciesId = pickFromPool(banner.epicPool, rng);
    epicCounterAfter = 0;
  } else if (roll < pLeg + 0.45) {
    rarity = 'Raro';
    speciesId = pickFromPool(banner.rarePool, rng);
  } else {
    rarity = 'Comum';
    speciesId = pickFromPool(banner.commonPool, rng);
  }

  const stateAfter: GachaPlayerState = {
    pityCounter: nextPullNumber,
    epicPityCounter: epicCounterAfter,
    guaranteedFeaturedNext: state.guaranteedFeaturedNext,
    goldenFeathers: remainingFeathers,
  };

  return {
    pullNumberInPityCycle: nextPullNumber,
    rarity,
    speciesId,
    isFeaturedLegendary: false,
    wonFiftyFifty: null,
    legendaryProbabilityUsed: pLeg,
    stateAfter,
    triggerFlashPityOffer: shouldTriggerFlashPityOffer(
      stateAfter.pityCounter,
      stateAfter.goldenFeathers
    ),
  };
}

export function executeTenPull(
  state: GachaPlayerState,
  banner: GachaBannerConfig = DEFAULT_CHOCADEIRA_BANNER,
  rng: () => number = Math.random,
  deductFeathers = true
): SinglePullOutcome[] {
  if (deductFeathers && state.goldenFeathers < TEN_PULL_FEATHER_COST) {
    throw new Error('Insufficient Golden Feathers for 10x Chocadeira pull');
  }
  let current = { ...state };
  const outcomes: SinglePullOutcome[] = [];
  for (let i = 0; i < 10; i++) {
    const out = executeSinglePull(current, banner, rng, deductFeathers);
    outcomes.push(out);
    current = out.stateAfter;
  }
  return outcomes;
}
