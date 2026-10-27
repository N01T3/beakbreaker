import type { BrazilianStateUF } from '@beakbreaker/game-data';
import type { InMemoryDatabase, Player, RoosterInstance } from '../../db/schema.js';
import { PlayerProfileShowcaseService } from './PlayerProfileShowcase.js';

export const MAX_DAILY_FRIEND_COLLECTIONS = 10;
export const BASE_FRIENDSHIP_CORN = 350;
export const BASE_FRIENDSHIP_SEEDS = 5;

export interface CoopPerchInspection {
  perchId: string; element: string; level: number; hasAdjacentTotem: boolean;
  roosters: Array<{ id: string; speciesId: string; rarity: string; stars: number; ng: number }>;
}

export interface FarmInspectionReport {
  visitorId: string; hostId: string; hostDisplayName: string;
  hostUf: BrazilianStateUF; hostSedeLevel: number; hostClanName: string | null;
  isBandoMember: boolean; perches: CoopPerchInspection[];
  totalRestingRoosters: number; totalCornRatePerMin: number;
  decorationPrestigeScore: number; prestigeTier: string;
  canClaimBonusToday: boolean; claimsRemainingToday: number;
}

export interface FriendshipBonusClaimResult {
  success: boolean; collectedCorn: number; collectedSeeds: number;
  isBandoBonus: boolean; dailyClaimsRemaining: number; error?: string;
}

export class FriendFarmVisitService {
  private dailyClaims = new Map<string, { dateKey: string; claimedHosts: Set<string> }>();
  private showcaseService: PlayerProfileShowcaseService;

  constructor(private readonly db: InMemoryDatabase) {
    this.showcaseService = new PlayerProfileShowcaseService(db);
  }

  private getDateKey(nowMs: number): string {
    return new Date(nowMs).toISOString().split('T')[0];
  }

  private getVisitorClaimState(visitorId: string, nowMs: number): { dateKey: string; claimedHosts: Set<string> } {
    const today = this.getDateKey(nowMs);
    const existing = this.dailyClaims.get(visitorId);
    if (!existing || existing.dateKey !== today) {
      const fresh = { dateKey: today, claimedHosts: new Set<string>() };
      this.dailyClaims.set(visitorId, fresh);
      return fresh;
    }
    return existing;
  }

  inspectFarm(visitorId: string, hostId: string, nowMs = Date.now()): FarmInspectionReport {
    const visitor = this.db.players.get(visitorId);
    const host = this.db.players.get(hostId);
    if (!visitor) throw new Error(`Visitante ${visitorId} não encontrado.`);
    if (!host) throw new Error(`Fazendeiro anfitrião ${hostId} não encontrado.`);

    const isBandoMember = Boolean(visitor.clanId && host.clanId && visitor.clanId === host.clanId);
    const hostClan = host.clanId ? this.db.clans.get(host.clanId) : null;
    const hostPerches = Array.from(this.db.perches.values()).filter((p) => p.playerId === host.id);

    let totalRestingRoosters = 0;
    let totalCornRatePerMin = 0;

    const perches: CoopPerchInspection[] = hostPerches.map((p) => {
      const roosts = p.roosterIds
        .map((id) => this.db.roosters.get(id))
        .filter((r): r is RoosterInstance => Boolean(r))
        .map((r) => {
          totalRestingRoosters += 1;
          const starMult = 1 + 0.15 * r.stars;
          const totemMult = p.hasAdjacentTotem ? 1.2 : 1.0;
          totalCornRatePerMin += 2.0 * r.ng * starMult * totemMult;
          return { id: r.id, speciesId: r.speciesId, rarity: r.rarity, stars: r.stars, ng: r.ng };
        });
      return { perchId: p.id, element: p.element, level: p.level, hasAdjacentTotem: p.hasAdjacentTotem, roosters: roosts };
    });

    const prestige = this.showcaseService.calculateDecorationPrestige(host);
    const claimState = this.getVisitorClaimState(visitorId, nowMs);
    const alreadyClaimed = claimState.claimedHosts.has(hostId);
    const claimsRemaining = Math.max(0, MAX_DAILY_FRIEND_COLLECTIONS - claimState.claimedHosts.size);
    const canClaim = visitorId !== hostId && !alreadyClaimed && claimsRemaining > 0;

    return {
      visitorId, hostId, hostDisplayName: host.displayName, hostUf: host.uf, hostSedeLevel: host.sedeLevel,
      hostClanName: hostClan ? hostClan.name : null, isBandoMember, perches, totalRestingRoosters,
      totalCornRatePerMin: Math.round(totalCornRatePerMin), decorationPrestigeScore: prestige.totalPrestige,
      prestigeTier: prestige.tier, canClaimBonusToday: canClaim, claimsRemainingToday: claimsRemaining,
    };
  }

  claimFriendshipBonus(visitorId: string, hostId: string, nowMs = Date.now()): FriendshipBonusClaimResult {
    if (visitorId === hostId) {
      return { success: false, collectedCorn: 0, collectedSeeds: 0, isBandoBonus: false, dailyClaimsRemaining: 0, error: 'Não é possível coletar bônus na própria fazenda.' };
    }

    const visitor = this.db.players.get(visitorId);
    const host = this.db.players.get(hostId);
    if (!visitor || !host) {
      return { success: false, collectedCorn: 0, collectedSeeds: 0, isBandoBonus: false, dailyClaimsRemaining: 0, error: 'Jogador ou anfitrião não encontrado.' };
    }

    const claimState = this.getVisitorClaimState(visitorId, nowMs);
    if (claimState.claimedHosts.has(hostId)) {
      return { success: false, collectedCorn: 0, collectedSeeds: 0, isBandoBonus: false, dailyClaimsRemaining: MAX_DAILY_FRIEND_COLLECTIONS - claimState.claimedHosts.size, error: 'Bônus de amizade já coletado deste amigo hoje.' };
    }

    if (claimState.claimedHosts.size >= MAX_DAILY_FRIEND_COLLECTIONS) {
      return { success: false, collectedCorn: 0, collectedSeeds: 0, isBandoBonus: false, dailyClaimsRemaining: 0, error: 'Limite diário de 10 coletas de amizade atingido.' };
    }

    const isBandoMember = Boolean(visitor.clanId && host.clanId && visitor.clanId === host.clanId);
    let collectedCorn = BASE_FRIENDSHIP_CORN + host.sedeLevel * 25;
    let collectedSeeds = BASE_FRIENDSHIP_SEEDS + Math.floor(host.sedeLevel / 3);

    if (isBandoMember) {
      collectedCorn = Math.floor(collectedCorn * 1.2);
      collectedSeeds += 2;
    }

    visitor.corn += collectedCorn;
    claimState.claimedHosts.add(hostId);

    return {
      success: true, collectedCorn, collectedSeeds, isBandoBonus: isBandoMember,
      dailyClaimsRemaining: MAX_DAILY_FRIEND_COLLECTIONS - claimState.claimedHosts.size,
    };
  }
}
