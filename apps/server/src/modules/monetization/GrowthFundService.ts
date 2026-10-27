import {
  GROWTH_FUND_PRICE_BRL,
  GROWTH_FUND_TIERS,
  GROWTH_FUND_TOTALS,
  getGrowthFundTier,
  type GrowthFundTier,
} from '@beakbreaker/game-data';
import type { InMemoryDatabase, Player } from '../../db/schema.js';

export interface PlayerGrowthFundRecord {
  playerId: string;
  isPremiumUnlocked: boolean;
  unlockedAtMs?: number;
  claimedFreeLevels: number[];
  claimedPremiumLevels: number[];
}

export interface GrowthFundTierStatus extends GrowthFundTier {
  isUnlocked: boolean;
  freeClaimed: boolean;
  premiumClaimed: boolean;
  canClaimFree: boolean;
  canClaimPremium: boolean;
}

export interface GrowthFundClaimResult {
  success: boolean;
  playerId: string;
  sedeLevel: number;
  claimedFree: boolean;
  claimedPremium: boolean;
  alreadyClaimedFree: boolean;
  alreadyClaimedPremium: boolean;
  granted: { milho: number; goldenFeathers: number; coroas: number; wildOrbs: number };
  balances: { corn: number; goldenFeathers: number; crowns: number; wildOrbs: number };
}

export class GrowthFundService {
  private records = new Map<string, PlayerGrowthFundRecord>();

  constructor(private readonly db: InMemoryDatabase) {}

  private getPlayer(playerId: string): Player {
    const player = this.db.players.get(playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    return player;
  }

  getOrCreateRecord(playerId: string): PlayerGrowthFundRecord {
    let rec = this.records.get(playerId);
    if (!rec) {
      rec = { playerId, isPremiumUnlocked: false, claimedFreeLevels: [], claimedPremiumLevels: [] };
      this.records.set(playerId, rec);
    }
    return rec;
  }

  getFundProgress(playerId: string) {
    const player = this.getPlayer(playerId);
    const rec = this.getOrCreateRecord(playerId);
    const tiers: GrowthFundTierStatus[] = GROWTH_FUND_TIERS.map((tier) => {
      const isUnlocked = player.sedeLevel >= tier.sedeLevel;
      const freeClaimed = rec.claimedFreeLevels.includes(tier.sedeLevel);
      const premiumClaimed = rec.claimedPremiumLevels.includes(tier.sedeLevel);
      return {
        ...tier,
        isUnlocked,
        freeClaimed,
        premiumClaimed,
        canClaimFree: isUnlocked && !freeClaimed,
        canClaimPremium: isUnlocked && rec.isPremiumUnlocked && !premiumClaimed,
      };
    });

    return {
      playerId,
      currentSedeLevel: player.sedeLevel,
      isPremiumUnlocked: rec.isPremiumUnlocked,
      priceBrl: GROWTH_FUND_PRICE_BRL,
      tiers,
      totals: GROWTH_FUND_TOTALS,
      claimedCount: {
        free: rec.claimedFreeLevels.length,
        premium: rec.claimedPremiumLevels.length,
        totalTiers: GROWTH_FUND_TIERS.length,
      },
    };
  }

  claimReward(
    playerId: string,
    sedeLevel: number,
    track: 'free' | 'premium' | 'all' = 'all'
  ): GrowthFundClaimResult {
    const player = this.getPlayer(playerId);
    const tier = getGrowthFundTier(sedeLevel);
    if (!tier) throw new Error('INVALID_SEDE_LEVEL');
    if (player.sedeLevel < sedeLevel) throw new Error('SEDE_LEVEL_NOT_REACHED');

    const rec = this.getOrCreateRecord(playerId);
    let claimedFree = false, claimedPremium = false;
    let alreadyClaimedFree = false, alreadyClaimedPremium = false;
    const granted = { milho: 0, goldenFeathers: 0, coroas: 0, wildOrbs: 0 };

    if (track === 'free' || track === 'all') {
      if (rec.claimedFreeLevels.includes(sedeLevel)) {
        alreadyClaimedFree = true;
      } else {
        player.corn += tier.freeReward.milho;
        player.goldenFeathers += tier.freeReward.goldenFeathers;
        rec.claimedFreeLevels.push(sedeLevel);
        claimedFree = true;
        granted.milho += tier.freeReward.milho;
        granted.goldenFeathers += tier.freeReward.goldenFeathers;
      }
    }

    if (track === 'premium' || track === 'all') {
      if (!rec.isPremiumUnlocked) {
        if (track === 'premium') throw new Error('PREMIUM_NOT_UNLOCKED');
      } else if (rec.claimedPremiumLevels.includes(sedeLevel)) {
        alreadyClaimedPremium = true;
      } else {
        player.goldenFeathers += tier.premiumReward.goldenFeathers;
        player.crowns += tier.premiumReward.coroas;
        player.wildOrbs += tier.premiumReward.wildOrbs;
        rec.claimedPremiumLevels.push(sedeLevel);
        claimedPremium = true;
        granted.goldenFeathers += tier.premiumReward.goldenFeathers;
        granted.coroas += tier.premiumReward.coroas;
        granted.wildOrbs += tier.premiumReward.wildOrbs;
      }
    }

    return {
      success: true, playerId, sedeLevel, claimedFree, claimedPremium,
      alreadyClaimedFree, alreadyClaimedPremium, granted,
      balances: {
        corn: player.corn, goldenFeathers: player.goldenFeathers,
        crowns: player.crowns, wildOrbs: player.wildOrbs,
      },
    };
  }

  unlockPremium(playerId: string, paymentConfirmed = true, nowMs = Date.now()) {
    if (!paymentConfirmed) throw new Error('PAYMENT_NOT_CONFIRMED');
    const player = this.getPlayer(playerId);
    const rec = this.getOrCreateRecord(playerId);
    if (rec.isPremiumUnlocked) {
      return { success: true, alreadyUnlocked: true, isPremiumUnlocked: true };
    }
    rec.isPremiumUnlocked = true;
    rec.unlockedAtMs = nowMs;
    player.totalSpentBrl += GROWTH_FUND_PRICE_BRL;
    return {
      success: true, alreadyUnlocked: false, isPremiumUnlocked: true,
      unlockedAtMs: nowMs, priceBrl: GROWTH_FUND_PRICE_BRL, totalSpentBrl: player.totalSpentBrl,
    };
  }
}
