import { WarMapScene } from '../../canvas/scenes/board/WarMapScene.js';

export type ColossusBossPhase = 'FASE_1_BRASA' | 'FASE_2_LUA' | 'FASE_3_FURIA';

export const COLOSSUS_HP_BY_DIFFICULTY: readonly number[] = [
  20_000_000,
  45_000_000,
  95_000_000,
  180_000_000,
  320_000_000,
  500_000_000,
  720_000_000,
  960_000_000,
  1_150_000_000,
  1_370_000_000,
] as const;

export interface OrbTradeOffer {
  offerId: string;
  requesterId: string;
  requestedRarity: 'Comum' | 'Raro' | 'Epico' | 'Lendario';
  orbsQuantity: number;
  fulfilled: boolean;
}

export class ClanController {
  public readonly maxClanMembers = 30;
  private clanLevel = 1;
  private raidDifficulty = 1;
  private colossusRemainingHp = COLOSSUS_HP_BY_DIFFICULTY[0]!;
  private tradeOffers: OrbTradeOffer[] = [];

  constructor(private readonly warMap = new WarMapScene()) {
    this.warMap.mount();
  }

  public setClanLevel(level: number): number {
    this.clanLevel = Math.max(1, Math.min(10, Math.floor(level)));
    return this.clanLevel;
  }

  public getClanLevel(): number {
    return this.clanLevel;
  }

  public startColossusRaid(difficulty: number): { maxHp: number; phase: ColossusBossPhase } {
    this.raidDifficulty = Math.max(1, Math.min(10, Math.floor(difficulty)));
    const maxHp = COLOSSUS_HP_BY_DIFFICULTY[this.raidDifficulty - 1]!;
    this.colossusRemainingHp = maxHp;
    return {
      maxHp,
      phase: this.getColossusPhase(),
    };
  }

  public getColossusPhase(): ColossusBossPhase {
    const maxHp = COLOSSUS_HP_BY_DIFFICULTY[this.raidDifficulty - 1]!;
    const ratio = this.colossusRemainingHp / maxHp;
    if (ratio > 0.66) return 'FASE_1_BRASA';
    if (ratio > 0.33) return 'FASE_2_LUA';
    return 'FASE_3_FURIA';
  }

  public recordRaidDamage(damage: number): {
    remainingHp: number;
    phase: ColossusBossPhase;
    defeated: boolean;
  } {
    this.colossusRemainingHp = Math.max(0, this.colossusRemainingHp - Math.max(0, Math.floor(damage)));
    return {
      remainingHp: this.colossusRemainingHp,
      phase: this.getColossusPhase(),
      defeated: this.colossusRemainingHp === 0,
    };
  }

  public getWarMap(): WarMapScene {
    return this.warMap;
  }

  public postOrbTradeOffer(offer: OrbTradeOffer): void {
    this.tradeOffers.push({ ...offer });
  }

  public fulfillOrbTrade(offerId: string): boolean {
    const offer = this.tradeOffers.find((o) => o.offerId === offerId);
    if (!offer || offer.fulfilled) return false;
    offer.fulfilled = true;
    return true;
  }
}
