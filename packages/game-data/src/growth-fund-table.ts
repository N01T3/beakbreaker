export interface GrowthFundFreeReward {
  milho: number;
  goldenFeathers: number;
}

export interface GrowthFundPremiumReward {
  goldenFeathers: number;
  coroas: number;
  wildOrbs: number;
}

export interface GrowthFundTier {
  sedeLevel: number;
  freeReward: GrowthFundFreeReward;
  premiumReward: GrowthFundPremiumReward;
}

export const GROWTH_FUND_PRICE_BRL = 39.9;

export const GROWTH_FUND_TIERS: readonly GrowthFundTier[] = [
  {
    sedeLevel: 1,
    freeReward: { milho: 10_000, goldenFeathers: 50 },
    premiumReward: { goldenFeathers: 250, coroas: 20, wildOrbs: 5 },
  },
  {
    sedeLevel: 2,
    freeReward: { milho: 15_000, goldenFeathers: 60 },
    premiumReward: { goldenFeathers: 300, coroas: 20, wildOrbs: 5 },
  },
  {
    sedeLevel: 3,
    freeReward: { milho: 20_000, goldenFeathers: 75 },
    premiumReward: { goldenFeathers: 350, coroas: 20, wildOrbs: 5 },
  },
  {
    sedeLevel: 4,
    freeReward: { milho: 25_000, goldenFeathers: 90 },
    premiumReward: { goldenFeathers: 400, coroas: 25, wildOrbs: 5 },
  },
  {
    sedeLevel: 5,
    freeReward: { milho: 30_000, goldenFeathers: 100 },
    premiumReward: { goldenFeathers: 450, coroas: 30, wildOrbs: 5 },
  },
  {
    sedeLevel: 6,
    freeReward: { milho: 35_000, goldenFeathers: 110 },
    premiumReward: { goldenFeathers: 500, coroas: 35, wildOrbs: 5 },
  },
  {
    sedeLevel: 7,
    freeReward: { milho: 40_000, goldenFeathers: 125 },
    premiumReward: { goldenFeathers: 550, coroas: 40, wildOrbs: 5 },
  },
  {
    sedeLevel: 8,
    freeReward: { milho: 45_000, goldenFeathers: 140 },
    premiumReward: { goldenFeathers: 600, coroas: 45, wildOrbs: 5 },
  },
  {
    sedeLevel: 9,
    freeReward: { milho: 55_000, goldenFeathers: 160 },
    premiumReward: { goldenFeathers: 650, coroas: 50, wildOrbs: 5 },
  },
  {
    sedeLevel: 10,
    freeReward: { milho: 65_000, goldenFeathers: 180 },
    premiumReward: { goldenFeathers: 700, coroas: 60, wildOrbs: 5 },
  },
  {
    sedeLevel: 11,
    freeReward: { milho: 75_000, goldenFeathers: 195 },
    premiumReward: { goldenFeathers: 800, coroas: 75, wildOrbs: 10 },
  },
  {
    sedeLevel: 12,
    freeReward: { milho: 85_000, goldenFeathers: 215 },
    premiumReward: { goldenFeathers: 950, coroas: 80, wildOrbs: 15 },
  },
] as const;

export const GROWTH_FUND_TOTALS = {
  freeMilho: 500_000,
  freeGoldenFeathers: 1_500,
  premiumGoldenFeathers: 6_500,
  premiumCoroas: 500,
  premiumWildOrbs: 75,
} as const;

export function getGrowthFundTier(sedeLevel: number): GrowthFundTier | undefined {
  return GROWTH_FUND_TIERS.find((tier) => tier.sedeLevel === sedeLevel);
}
