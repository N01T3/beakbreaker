import type { FastifyInstance } from 'fastify';
import type { InMemoryDatabase, RoosterInstance } from '../db/schema.js';

export const CAMPAIGN_CHAPTERS = [
  { chapter: 1, region: 'Cariri', boss: 'Valentão', startStage: 1, endStage: 15 },
  { chapter: 2, region: 'Caruaru', boss: 'Zabumba Gigante', startStage: 16, endStage: 30 },
  { chapter: 3, region: 'Velho Chico', boss: 'Barqueira do Rio', startStage: 31, endStage: 45 },
  { chapter: 4, region: 'Serra da Capivara', boss: 'Caipora Ancestral', startStage: 46, endStage: 60 },
  { chapter: 5, region: 'Mar de Jangadas', boss: 'Jangadeiro do Vento', startStage: 61, endStage: 75 },
  { chapter: 6, region: 'Raso da Catarina', boss: 'Galo de Ferro', startStage: 76, endStage: 90 },
] as const;

export const TOWER_MODIFIERS_12 = [
  'Seca', 'Chuva', 'Noite', 'Ventania', 'Sol a Pino', 'Neblina da Serra',
  'Muralha', 'Assombração', 'Fúria do Coronel', 'Fé na Sanfona', 'Espinheiro', 'Festa no Arraial',
] as const;

export const WORKSHOP_SETS_8 = [
  'Brasa Viva', 'Couro de Gibão', 'Mandacaru', 'Vento do Arraial',
  'Luar do Sertão', 'Águas do Velho Chico', 'Armorial Real', 'Cangaço de Aço',
] as const;

export const LEAGUE_TIERS_6 = [
  { name: 'Bronze', minTrophies: 0, seasonFeathers: 100, seasonWildOrbs: 0 },
  { name: 'Prata', minTrophies: 400, seasonFeathers: 300, seasonWildOrbs: 0 },
  { name: 'Ouro', minTrophies: 1_000, seasonFeathers: 800, seasonWildOrbs: 10 },
  { name: 'Diamante', minTrophies: 1_800, seasonFeathers: 1_500, seasonWildOrbs: 30 },
  { name: 'Lenda', minTrophies: 2_800, seasonFeathers: 2_500, seasonWildOrbs: 60 },
  { name: 'Supremo Sertão', minTrophies: 4_000, seasonFeathers: 4_000, seasonWildOrbs: 100 },
] as const;

export class BattleService {
  constructor(private readonly db: InMemoryDatabase) {}

  /** Campanha "Estrada do Sertão" (90 fases em 6 capítulos, 6 de Fôlego por fase, varredura 3★). */
  runCampaignStage(
    playerId: string,
    stage: number,
    starsEarned: 1 | 2 | 3,
    isSweep = false
  ): { stage: number; chapter: number; boss: string; feathersEarned: number; cornEarned: number } {
    if (stage < 1 || stage > 90) throw new Error('INVALID_CAMPAIGN_STAGE');
    const player = this.db.players.get(playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    if (isSweep && (player.campaignStars[stage] ?? 0) < 3) throw new Error('SWEEP_REQUIRES_3_STARS');
    if (player.stamina < 6) throw new Error('INSUFFICIENT_STAMINA_6_REQUIRED');

    player.stamina -= 6;
    player.campaignStars[stage] = Math.max(player.campaignStars[stage] ?? 0, starsEarned);
    const chapterInfo = CAMPAIGN_CHAPTERS.find((c) => stage >= c.startStage && stage <= c.endStage)!;
    const feathersEarned = stage === chapterInfo.endStage ? 50 : 10;
    const cornEarned = stage * 250;
    player.goldenFeathers += feathersEarned;
    player.corn += cornEarned;

    return { stage, chapter: chapterInfo.chapter, boss: chapterInfo.boss, feathersEarned, cornEarned };
  }

  /** Torre do Mandacaru (100 andares mensais, 0 Fôlego, 600 Penas/mês no total, 12 modificadores). */
  climbMandacaruTowerFloor(
    playerId: string,
    floor: number
  ): { floor: number; activeModifier: string; feathersAwarded: number; cheerCharges: 1 | 2 } {
    if (floor < 1 || floor > 100) throw new Error('INVALID_TOWER_FLOOR');
    const player = this.db.players.get(playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    if (floor !== player.towerProgressFloor + 1) throw new Error('MUST_CLIMB_SEQUENTIALLY');

    const isBossFloor = floor % 10 === 0;
    const activeModifier = isBossFloor ? 'Festa no Arraial' : TOWER_MODIFIERS_12[(floor - 1) % 11];
    const feathersAwarded = 6; // 100 * 6 = 600 Penas Douradas/mês
    player.towerProgressFloor = floor;
    player.goldenFeathers += feathersAwarded;

    return { floor, activeModifier, feathersAwarded, cheerCharges: isBossFloor ? 2 : 1 };
  }

  /** Oficina da Vila: refino +1 a +15 e 8 conjuntos de equipamento. */
  refineEquipment(
    playerId: string,
    roosterId: string,
    slot: 'penacho' | 'peitoral' | 'anilha' | 'amuleto'
  ): RoosterInstance {
    const player = this.db.players.get(playerId);
    const rooster = this.db.roosters.get(roosterId);
    if (!player || !rooster || rooster.ownerId !== playerId) throw new Error('ROOSTER_NOT_FOUND');
    const current = rooster.equipmentRefinement[slot] ?? 0;
    if (current >= 15) throw new Error('MAX_REFINEMENT_15_REACHED');
    const cornCost = (current + 1) * 1_500;
    if (player.corn < cornCost) throw new Error('INSUFFICIENT_CORN');
    player.corn -= cornCost;
    rooster.equipmentRefinement[slot] = current + 1;
    return rooster;
  }

  /** Liga Ranqueada (6 faixas) e reset sazonal de 50% acima de 1.000 troféus. */
  getLeagueTier(trophies: number): (typeof LEAGUE_TIERS_6)[number] {
    let matched: (typeof LEAGUE_TIERS_6)[number] = LEAGUE_TIERS_6[0];
    for (const tier of LEAGUE_TIERS_6) {
      if (trophies >= tier.minTrophies) matched = tier;
    }
    return matched;
  }

  applySeasonalLeagueReset(playerId: string): { oldTrophies: number; newTrophies: number; tier: string } {
    const player = this.db.players.get(playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    const oldTrophies = player.trophies;
    const tier = this.getLeagueTier(oldTrophies);
    player.goldenFeathers += tier.seasonFeathers;
    player.wildOrbs += tier.seasonWildOrbs;
    if (oldTrophies > 1_000) player.trophies = 1_000 + Math.floor((oldTrophies - 1_000) * 0.5);
    return { oldTrophies, newTrophies: player.trophies, tier: tier.name };
  }

  /** Liga Supremo 9v9: Melhor de 3 trios a partir de 2.800 troféus (Faixa Lenda). */
  resolveSupremo9v9Match(
    playerId: string,
    roundWins: [boolean, boolean, boolean]
  ): { victory: boolean; roundsWon: number; trophiesDelta: number } {
    const player = this.db.players.get(playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    if (player.trophies < 2_800) throw new Error('SUPREMO_9V9_REQUIRES_2800_TROPHIES_LENDA');
    const roundsWon = roundWins.filter(Boolean).length;
    const victory = roundsWon >= 2;
    const trophiesDelta = victory ? 30 : -15;
    player.trophies = Math.max(0, player.trophies + trophiesDelta);
    if (victory) player.piggyBankFeathers = Math.min(1_200, player.piggyBankFeathers + 25);
    return { victory, roundsWon, trophiesDelta };
  }
}

export async function registerBattleRoutes(app: FastifyInstance, service: BattleService): Promise<void> {
  app.post('/battle/campaign', async (req) => {
    const b = req.body as { playerId: string; stage: number; stars: 1 | 2 | 3; isSweep?: boolean };
    return service.runCampaignStage(b.playerId, b.stage, b.stars, b.isSweep);
  });
  app.post('/battle/tower', async (req) => {
    const b = req.body as { playerId: string; floor: number };
    return service.climbMandacaruTowerFloor(b.playerId, b.floor);
  });
}
