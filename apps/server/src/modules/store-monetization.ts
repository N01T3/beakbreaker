import type { InMemoryDatabase, Player } from '../db/schema.js';

export const VAULT_MAX_CROWNS = 500;
export const VAULT_CROWNS_PER_VICTORY = 10;
export const VAULT_BREAK_PRICE_BRL = 9.9;
export const FARMER_CARD_PRICE_BRL = 29.9;
export const FARMER_CARD_IMMEDIATE_FEATHERS = 300;
export const FARMER_CARD_DAILY_FEATHERS = 100;
export const FARMER_CARD_HARVEST_BONUS = 0.2;
export const FARMER_CARD_DURATION_MS = 30 * 86_400_000;
export const ORB_CLUB_PRICE_BRL = 19.9;
export const ORB_CLUB_IMMEDIATE_ORBS = 20;
export const ORB_CLUB_DAILY_ORBS = 10;
export const ORB_CLUB_DURATION_MS = 30 * 86_400_000;
export const VIP_POINTS_PER_BRL = 10;
export const FLASH_OFFER_PRICE_BRL = 34.9;
export const FLASH_OFFER_PULLS = 20;
export const FLASH_OFFER_DURATION_SECONDS = 7200;

export interface VipTier {
  level: number;
  points: number;
  brl: number;
  perk: string;
}

export const VIP_TIERS: VipTier[] = [
  { level: 1, points: 100, brl: 10, perk: '+5% velocidade de colheita' }, { level: 2, points: 250, brl: 25, perk: '+5% capacidade do celeiro' },
  { level: 3, points: 450, brl: 45, perk: '+1 tentativa na Torre' }, { level: 4, points: 700, brl: 70, perk: '+10% velocidade de colheita' },
  { level: 5, points: 1000, brl: 100, perk: '+1 slot no ninhal' }, { level: 6, points: 1500, brl: 150, perk: '+10% milho nas expedicoes' },
  { level: 7, points: 2200, brl: 220, perk: '+2 tentativas na Torre' }, { level: 8, points: 3000, brl: 300, perk: '+15% velocidade de colheita' },
  { level: 9, points: 4000, brl: 400, perk: '+2 slots no ninhal' }, { level: 10, points: 5000, brl: 500, perk: 'Varredura instantânea da Torre' },
  { level: 11, points: 7500, brl: 750, perk: '+20% velocidade de colheita' }, { level: 12, points: 10500, brl: 1050, perk: '+20% producao dos poleiros' },
  { level: 13, points: 13500, brl: 1350, perk: '+30% velocidade de colheita' }, { level: 14, points: 16500, brl: 1650, perk: '+2 slots adicionais' },
  { level: 15, points: 20000, brl: 2000, perk: 'Teto VIP com benefícios máximos' },
];

export interface FlashOffer {
  id: string;
  priceBrl: number;
  pulls: number;
  discountPercent: number;
  durationSeconds: number;
  expiresAtMs: number;
}

export function calculateVipLevel(pointsOrSpend: number, isPoints = true): number {
  const pts = isPoints ? pointsOrSpend : Math.floor(pointsOrSpend * VIP_POINTS_PER_BRL);
  let lvl = 0;
  for (const tier of VIP_TIERS) {
    if (pts >= tier.points) lvl = tier.level;
  }
  return lvl;
}

export class StoreMonetizationService {
  private vaultCrownsByPlayer = new Map<string, number>();
  private lastFarmerClaimDay = new Map<string, number>();
  private lastOrbClubClaimDay = new Map<string, number>();
  private activeFlashOffers = new Map<string, FlashOffer>();

  constructor(private readonly db: InMemoryDatabase) {}

  private getPlayer(playerId: string): Player {
    const player = this.db.players.get(playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    return player;
  }

  getVaultCrowns(playerId: string): number {
    return this.vaultCrownsByPlayer.get(playerId) ?? 0;
  }

  accumulateVaultCrowns(playerId: string, crowns = VAULT_CROWNS_PER_VICTORY): { crowns: number; isFull: boolean } {
    this.getPlayer(playerId);
    const updated = Math.min(VAULT_MAX_CROWNS, this.getVaultCrowns(playerId) + crowns);
    this.vaultCrownsByPlayer.set(playerId, updated);
    return { crowns: updated, isFull: updated >= VAULT_MAX_CROWNS };
  }

  recordArenaVictory(playerId: string): { crowns: number; isFull: boolean } {
    return this.accumulateVaultCrowns(playerId, VAULT_CROWNS_PER_VICTORY);
  }

  breakVault(playerId: string) {
    const player = this.getPlayer(playerId);
    if (this.getVaultCrowns(playerId) < VAULT_MAX_CROWNS) throw new Error('VAULT_NOT_FULL');
    player.crowns += VAULT_MAX_CROWNS;
    this.vaultCrownsByPlayer.set(playerId, 0);
    this.recordPixPayment(player, VAULT_BREAK_PRICE_BRL);
    return { creditedCrowns: VAULT_MAX_CROWNS, totalCrowns: player.crowns, priceBrl: VAULT_BREAK_PRICE_BRL };
  }

  subscribeFarmerCard(playerId: string, nowMs = Date.now()) {
    const player = this.getPlayer(playerId);
    player.goldenFeathers += FARMER_CARD_IMMEDIATE_FEATHERS;
    player.farmerCardActiveUntil = Math.max(nowMs, player.farmerCardActiveUntil) + FARMER_CARD_DURATION_MS;
    this.recordPixPayment(player, FARMER_CARD_PRICE_BRL);
    return { activeUntil: player.farmerCardActiveUntil, goldenFeathers: player.goldenFeathers, bonusHarvest: FARMER_CARD_HARVEST_BONUS };
  }

  claimFarmerCardDaily(playerId: string, nowMs = Date.now()) {
    const player = this.getPlayer(playerId);
    if (player.farmerCardActiveUntil < nowMs) throw new Error('FARMER_CARD_NOT_ACTIVE');
    const day = Math.floor(nowMs / 86_400_000);
    if (day <= (this.lastFarmerClaimDay.get(playerId) ?? -1)) throw new Error('ALREADY_CLAIMED_TODAY');
    this.lastFarmerClaimDay.set(playerId, day);
    player.goldenFeathers += FARMER_CARD_DAILY_FEATHERS;
    return { claimedFeathers: FARMER_CARD_DAILY_FEATHERS, totalFeathers: player.goldenFeathers };
  }

  subscribeOrbClub(playerId: string, nowMs = Date.now()) {
    const player = this.getPlayer(playerId);
    player.wildOrbs += ORB_CLUB_IMMEDIATE_ORBS;
    player.orbClubActiveUntil = Math.max(nowMs, player.orbClubActiveUntil) + ORB_CLUB_DURATION_MS;
    this.recordPixPayment(player, ORB_CLUB_PRICE_BRL);
    return { activeUntil: player.orbClubActiveUntil, wildOrbs: player.wildOrbs };
  }

  claimOrbClubDaily(playerId: string, nowMs = Date.now()) {
    const player = this.getPlayer(playerId);
    if (player.orbClubActiveUntil < nowMs) throw new Error('ORB_CLUB_NOT_ACTIVE');
    const day = Math.floor(nowMs / 86_400_000);
    if (day <= (this.lastOrbClubClaimDay.get(playerId) ?? -1)) throw new Error('ALREADY_CLAIMED_TODAY');
    this.lastOrbClubClaimDay.set(playerId, day);
    player.wildOrbs += ORB_CLUB_DAILY_ORBS;
    return { claimedOrbs: ORB_CLUB_DAILY_ORBS, totalOrbs: player.wildOrbs };
  }

  getFarmerHarvestBonus(playerId: string, nowMs = Date.now()): number {
    return this.getPlayer(playerId).farmerCardActiveUntil >= nowMs ? FARMER_CARD_HARVEST_BONUS : 0;
  }

  recordPixPayment(playerOrId: Player | string, amountBrl: number) {
    const player = typeof playerOrId === 'string' ? this.getPlayer(playerOrId) : playerOrId;
    player.totalSpentBrl = Number((player.totalSpentBrl + amountBrl).toFixed(2));
    const points = Math.floor(player.totalSpentBrl * VIP_POINTS_PER_BRL);
    player.vipLevel = calculateVipLevel(points, true);
    return { vipPoints: points, vipLevel: player.vipLevel, totalSpentBrl: player.totalSpentBrl };
  }

  checkFlashOffer(playerId: string, nowMs = Date.now()): FlashOffer | null {
    const player = this.getPlayer(playerId);
    if (!(player.pityCounter >= 58 && player.pityCounter <= 65 && player.goldenFeathers < 160)) return null;
    const existing = this.activeFlashOffers.get(playerId);
    if (existing && nowMs < existing.expiresAtMs) return existing;
    const offer: FlashOffer = {
      id: 'FLASH_PITY_OFFER',
      priceBrl: FLASH_OFFER_PRICE_BRL,
      pulls: FLASH_OFFER_PULLS,
      discountPercent: 60,
      durationSeconds: FLASH_OFFER_DURATION_SECONDS,
      expiresAtMs: nowMs + FLASH_OFFER_DURATION_SECONDS * 1000,
    };
    this.activeFlashOffers.set(playerId, offer);
    return offer;
  }

  checkFlashOfferTrigger(playerId: string, nowMs = Date.now()): FlashOffer | null {
    return this.checkFlashOffer(playerId, nowMs);
  }

  purchaseFlashOffer(playerId: string, nowMs = Date.now()) {
    const player = this.getPlayer(playerId);
    const offer = this.activeFlashOffers.get(playerId);
    if (!offer || nowMs > offer.expiresAtMs) throw new Error('FLASH_OFFER_EXPIRED');
    player.goldenFeathers += offer.pulls * 160;
    this.recordPixPayment(player, offer.priceBrl);
    this.activeFlashOffers.delete(playerId);
    return { pullsCredited: offer.pulls, goldenFeathers: player.goldenFeathers };
  }
}
